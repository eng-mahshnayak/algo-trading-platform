import json
import sys

def main():
    try:
        # Simple test output
        result = {
            "success": True,
            "message": "Python script is working",
            "test": "connection successful"
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()