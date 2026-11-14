import os
import sys
import subprocess
import signal
import time
import threading

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

# Terminal colors
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

processes = []

def stream_output(process, prefix, color):
    try:
        for line in iter(process.stdout.readline, ''):
            if not line:
                break
            print(f"{color}[{prefix}]{RESET} {line.strip()}", flush=True)
    except Exception:
        pass

def check_ollama():
    print(f"{YELLOW}🔍 Checking local Ollama service...{RESET}", flush=True)
    try:
        import urllib.request
        req = urllib.request.urlopen("http://localhost:11434/api/tags", timeout=3)
        if req.status == 200:
            print(f"{GREEN}✓ Ollama is online and ready (Llama 3.2).{RESET}\n", flush=True)
            return True
    except Exception:
        print(f"{YELLOW}⚠️  Ollama does not appear to be running on http://localhost:11434.{RESET}")
        print(f"{YELLOW}   Please run 'ollama run llama3.2' in another terminal if you want AI interactions.{RESET}\n", flush=True)
    return False

def main():
    print(f"{BOLD}{GREEN}===================================================={RESET}")
    print(f"{BOLD}{GREEN}        🏘️  TINY SOCIETY UNIFIED LAUNCHER          {RESET}")
    print(f"{BOLD}{GREEN}===================================================={RESET}\n")

    check_ollama()

    # Determine backend python executable
    venv_python = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = sys.executable

    print(f"{CYAN}🚀 Starting Backend on http://localhost:8000 ...{RESET}")
    backend_cmd = [
        venv_python,
        "-m",
        "uvicorn",
        "app.main:app",
        "--reload",
        "--port",
        "8000"
    ]

    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = BACKEND_DIR

    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=BACKEND_DIR,
        env=backend_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=(os.name == 'nt')
    )
    processes.append(backend_proc)

    t_back = threading.Thread(target=stream_output, args=(backend_proc, "Backend", GREEN), daemon=True)
    t_back.start()

    time.sleep(1)

    print(f"{CYAN}🚀 Starting Frontend on http://localhost:5173 ...{RESET}\n")
    # Determine npm executable
    npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=(os.name == 'nt')
    )
    processes.append(frontend_proc)

    t_front = threading.Thread(target=stream_output, args=(frontend_proc, "Frontend", CYAN), daemon=True)
    t_front.start()

    print(f"{BOLD}✨ Both servers are running! Press Ctrl+C to stop both.{RESET}\n")

    def signal_handler(sig, frame):
        print(f"\n{YELLOW}🛑 Shutting down Tiny Society servers...{RESET}")
        for p in processes:
            try:
                if os.name == 'nt':
                    subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
            except Exception:
                pass
        print(f"{GREEN}✓ Shutdown complete. See you soon in Tiny Society!{RESET}")
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        while True:
            time.sleep(1)
            # Check if any process died unexpectedly
            if backend_proc.poll() is not None:
                print(f"{RED}Backend process stopped unexpectedly.{RESET}")
                break
            if frontend_proc.poll() is not None:
                print(f"{RED}Frontend process stopped unexpectedly.{RESET}")
                break
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
