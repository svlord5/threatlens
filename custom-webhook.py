#!/usr/bin/env python3
import sys
import json
import urllib.request
import urllib.parse

def main():
    # Wazuh passes arguments: script_name alert_file api_key hook_url
    if len(sys.argv) < 4:
        sys.exit(1)

    alert_file = sys.argv[1]
    api_key = sys.argv[2]
    hook_url = sys.argv[3]

    # Read the alert JSON from the file Wazuh passes
    with open(alert_file, 'r') as f:
        alert_data = json.load(f)

    # Post it to the webhook URL
    req = urllib.request.Request(hook_url)
    req.add_header('Content-Type', 'application/json; charset=utf-8')
    req.add_header('Authorization', 'Bearer ' + api_key)
    
    jsondata = json.dumps(alert_data)
    jsondataasbytes = jsondata.encode('utf-8')
    req.add_header('Content-Length', len(jsondataasbytes))

    try:
        response = urllib.request.urlopen(req, jsondataasbytes)
    except Exception as e:
        sys.exit(1)

if __name__ == "__main__":
    main()
