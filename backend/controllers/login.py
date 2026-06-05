from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from urllib.parse import urlparse, parse_qs
import pyotp
import time
import json
import hashlib
import requests
import sys

# ─── CONFIG ───────────────────────────────────────────────────────────────────
CLIENT_ID   = "FN194505"
USER_ID     = "FN194505_U"
PASSWORD    = "Mgn@1997"
TOTP_SECRET = "F3OJ3XZT632FD3C4I6OK67IDRR23IC7V"
SECRET_CODE = "a6o4y5CKbDQzbKFbXLoQ4nyB6QFnRjG3H1cDPGFzXf35aRYiDXPcKLjIHnQHHX98"
LOGIN_URL   = f"https://trade.shoonya.com/OAuthlogin/investor-entry-level/login?api_key={CLIENT_ID}&route_to=FN194505"
TOKEN_URL   = "https://trade.shoonya.com/NorenWClientAPI/GenAcsTok"

def fast_fill(driver, element, value):
    element.click()
    time.sleep(0.1)
    element.clear()
    element.send_keys(value)
    time.sleep(0.1)

# ── Chrome VISIBLE (not headless) ────────────────────────────────────────────
options = webdriver.ChromeOptions()
# options.add_argument("--headless=new")  # COMMENTED OUT - we want to see the browser
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--window-size=1920,1080")

driver = webdriver.Chrome(options=options)
wait = WebDriverWait(driver, 30)

try:
    print("Opening browser window...")
    driver.get(LOGIN_URL)
    
    # Wait for password field
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='password']")))
    time.sleep(2)
    
    # Find input fields
    all_inputs = driver.find_elements(By.CSS_SELECTOR, "input:not([type='hidden']):not([type='checkbox']):not([type='radio'])")
    visible_inputs = [inp for inp in all_inputs if inp.is_displayed()]
    
    print(f"Found {len(visible_inputs)} input fields")
    
    # Fill credentials
    fast_fill(driver, visible_inputs[0], USER_ID)
    fast_fill(driver, visible_inputs[1], PASSWORD)
    
    otp_value = pyotp.TOTP(TOTP_SECRET).now()
    print(f"Using OTP: {otp_value}")
    fast_fill(driver, visible_inputs[2], otp_value)
    
    # Click login button
    login_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='LOGIN']")))
    login_button.click()
    
    print("Login clicked. Waiting 10 seconds to see what happens...")
    time.sleep(10)
    
    # Check current URL
    current_url = driver.current_url
    print(f"Current URL after login: {current_url}")
    
    # Check page title
    print(f"Page title: {driver.title}")
    
    # Take screenshot
    driver.save_screenshot("after_login.png")
    print("Screenshot saved as after_login.png")
    
    input("Press Enter to close browser...")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    driver.quit()