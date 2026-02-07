#!/usr/bin/env python3
"""Test Supabase connection and credentials"""

import requests
import json

# Supabase credentials from Vercel config
SUPABASE_URL = "https://kzdjqqinkonqlclbwleh.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZGpxcWlua29ucWxjbGJ3bGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTQ0ODcsImV4cCI6MjA4NTgzMDQ4N30.CrgPY7OI6eSoEe9CNDlK0apob1UG8KH5v21GI2UQS6I"

def test_supabase():
    print("=" * 60)
    print("Testing Supabase Connection")
    print("=" * 60)

    # Test 1: Check if Supabase URL is reachable
    print("\n1. Testing Supabase URL reachability...")
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/",
                               headers={"apikey": SUPABASE_ANON_KEY},
                               timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Supabase URL is reachable")
        else:
            print(f"   ❌ Unexpected status: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Failed to reach Supabase: {e}")
        return False

    # Test 2: Check auth endpoint
    print("\n2. Testing Auth endpoint...")
    try:
        response = requests.get(f"{SUPABASE_URL}/auth/v1/health",
                               headers={"apikey": SUPABASE_ANON_KEY},
                               timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Auth service is healthy")
            data = response.json()
            print(f"   Details: {json.dumps(data, indent=2)}")
        else:
            print(f"   Response: {response.text[:200]}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Auth check failed: {e}")

    # Test 3: Verify JWT token structure
    print("\n3. Verifying JWT token structure...")
    try:
        import base64
        parts = SUPABASE_ANON_KEY.split('.')
        if len(parts) == 3:
            # Decode header
            header = json.loads(base64.urlsafe_b64decode(parts[0] + '=='))
            print(f"   Header: {header}")

            # Decode payload
            payload = json.loads(base64.urlsafe_b64decode(parts[1] + '=='))
            print(f"   Payload: {json.dumps(payload, indent=2)}")

            # Check ref matches URL
            if payload.get('ref') in SUPABASE_URL:
                print("   ✅ JWT 'ref' matches Supabase URL")
            else:
                print("   ❌ JWT 'ref' does NOT match Supabase URL!")
                print(f"      ref: {payload.get('ref')}")
                print(f"      URL: {SUPABASE_URL}")

            # Check expiration
            import datetime
            exp = payload.get('exp')
            if exp:
                exp_date = datetime.datetime.fromtimestamp(exp)
                now = datetime.datetime.now()
                if exp_date > now:
                    print(f"   ✅ Token valid until: {exp_date}")
                else:
                    print(f"   ❌ Token EXPIRED on: {exp_date}")
        else:
            print("   ❌ Invalid JWT format")
    except Exception as e:
        print(f"   ❌ JWT parsing error: {e}")

    # Test 4: Try to get session (should return null for anonymous)
    print("\n4. Testing anonymous session...")
    try:
        response = requests.get(f"{SUPABASE_URL}/auth/v1/user",
                               headers={
                                   "apikey": SUPABASE_ANON_KEY,
                                   "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
                               },
                               timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code in [200, 401]:
            print("   ✅ Auth endpoint responding correctly")
        print(f"   Response: {response.text[:200]}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Session test failed: {e}")

    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    test_supabase()
