import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TEMP_DIR = path.join(__dirname, '..', '..', 'temp_exec');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs: number;
}

export const executeCode = async (
  code: string,
  language: string,
  stdin: string = ''
): Promise<ExecutionResult> => {
  const jobId = uuidv4();
  const jobDir = path.join(TEMP_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  let filename = '';
  let compileCmd = '';
  let runCmd = '';
  let runArgs: string[] = [];

  switch (language) {
    case 'python':
      filename = 'solution.py';
      runCmd = process.platform === 'win32' ? 'python' : 'python3';
      runArgs = [filename];
      break;
    case 'javascript':
      filename = 'solution.js';
      runCmd = 'node';
      runArgs = [filename];
      break;
    case 'cpp':
      filename = 'solution.cpp';
      compileCmd = `g++ -O3 solution.cpp -o solution.exe`;
      runCmd = process.platform === 'win32' ? 'solution.exe' : './solution.exe';
      break;
    case 'java':
      filename = 'Main.java';
      // Java class name must match Main
      // Let's replace class name in java code if user wrote something else, or assume Main
      compileCmd = `javac Main.java`;
      runCmd = 'java';
      runArgs = ['Main'];
      break;
    default:
      return {
        stdout: '',
        stderr: `Unsupported language: ${language}`,
        exitCode: 1,
        timeMs: 0,
      };
  }

  const filePath = path.join(jobDir, filename);
  fs.writeFileSync(filePath, code);

  return new Promise((resolve) => {
    const startTime = Date.now();

    const cleanup = () => {
      try {
        fs.rmSync(jobDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`Failed to clean up job directory ${jobDir}:`, err);
      }
    };

    const runProcess = () => {
      const child = spawn(runCmd, runArgs, {
        cwd: jobDir,
        env: { PATH: process.env.PATH }, // Restrict env variables
      });

      let stdout = '';
      let stderr = '';
      let isFinished = false;

      // Handle input streams (stdin)
      if (stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        // Limit stdout buffer sizes to prevent memory overflow (e.g. 512KB)
        if (stdout.length > 512 * 1024) {
          child.kill();
          stderr += '\n[Execution Error: Standard output limit exceeded (512KB)]';
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutId = setTimeout(() => {
        if (!isFinished) {
          child.kill('SIGKILL');
          isFinished = true;
          cleanup();
          resolve({
            stdout,
            stderr: stderr + '\n[Execution Error: Time limit exceeded (5000ms)]',
            exitCode: null,
            timeMs: Date.now() - startTime,
          });
        }
      }, 5000); // 5 seconds execution limit

      child.on('close', (code) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timeoutId);
        cleanup();
        resolve({
          stdout,
          stderr,
          exitCode: code,
          timeMs: Date.now() - startTime,
        });
      });

      child.on('error', (err) => {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timeoutId);
        cleanup();
        resolve({
          stdout,
          stderr: stderr + `\n[Execution Error: Could not start process - ${err.message}. Ensure '${runCmd}' is installed.]`,
          exitCode: -1,
          timeMs: Date.now() - startTime,
        });
      });
    };

    // Compile if necessary
    if (compileCmd) {
      exec(compileCmd, { cwd: jobDir, timeout: 10000 }, (error, compileStdout, compileStderr) => {
        if (error) {
          cleanup();
          resolve({
            stdout: compileStdout,
            stderr: `[Compilation Error]\n${compileStderr}`,
            exitCode: error.code || 1,
            timeMs: Date.now() - startTime,
          });
        } else {
          runProcess();
        }
      });
    } else {
      runProcess();
    }
  });
};
