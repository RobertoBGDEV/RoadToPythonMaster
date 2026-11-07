"""Reads {"code","spec"} from stdin, runs the shared harness, prints its JSON report."""
import json, sys, runpy
payload = json.load(sys.stdin)
ns = runpy.run_path("public/harness.py")
sys.stdout.write(ns["rtpm_run"](payload["code"], json.dumps(payload["spec"])))
