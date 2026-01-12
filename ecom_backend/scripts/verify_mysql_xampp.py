#!/usr/bin/env python
"""
MySQL XAMPP Verification Script
===============================
This script verifies your XAMPP MySQL setup for Django.

Usage:
    python scripts/verify_mysql_xampp.py
"""

import os
import sys
import subprocess
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(project_root / '.env')


def print_header(text):
    """Print a formatted header."""
    print("\n" + "=" * 50)
    print(f" {text}")
    print("=" * 50)


def print_status(check, status, message=""):
    """Print check status."""
    icon = "[OK]" if status else "[FAIL]"
    print(f"  {icon} {check}")
    if message:
        print(f"      -> {message}")


def check_mysql_running():
    """Check if MySQL server is running."""
    print_header("Step 1: Checking MySQL Server")

    # Try to connect using mysql command
    try:
        result = subprocess.run(
            ['mysql', '--version'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print_status("MySQL client installed", True, result.stdout.strip())
        else:
            print_status("MySQL client installed", False)
            return False
    except FileNotFoundError:
        print_status("MySQL client installed", False, "mysql command not found in PATH")
        print("\n  TIP: Add XAMPP MySQL to your PATH:")
        print("       Windows: C:\\xampp\\mysql\\bin")
        print("       Linux: /opt/lampp/bin")
        print("       Mac: /Applications/XAMPP/xamppfiles/bin")
        return False

    # Check if server is running
    host = os.getenv('DATABASE_HOST', 'localhost')
    port = os.getenv('DATABASE_PORT', '3306')
    user = os.getenv('DATABASE_USER', 'root')
    password = os.getenv('DATABASE_PASSWORD', '')

    cmd = ['mysql', '-h', host, '-P', port, '-u', user, '-e', 'SELECT 1;']
    if password:
        cmd.insert(4, f'-p{password}')

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print_status("MySQL server running", True, f"Connected to {host}:{port}")
            return True
        else:
            print_status("MySQL server running", False, result.stderr.strip())
            print("\n  TIP: Start MySQL from XAMPP Control Panel")
            return False
    except subprocess.TimeoutExpired:
        print_status("MySQL server running", False, "Connection timeout")
        return False
    except Exception as e:
        print_status("MySQL server running", False, str(e))
        return False


def check_database_exists():
    """Check if the database exists and create if not."""
    print_header("Step 2: Checking Database")

    db_name = os.getenv('DATABASE_NAME', 'erp_ecommerce')
    host = os.getenv('DATABASE_HOST', 'localhost')
    port = os.getenv('DATABASE_PORT', '3306')
    user = os.getenv('DATABASE_USER', 'root')
    password = os.getenv('DATABASE_PASSWORD', '')

    # Check if database exists
    cmd = ['mysql', '-h', host, '-P', port, '-u', user, '-e', f"SHOW DATABASES LIKE '{db_name}';"]
    if password:
        cmd.insert(4, f'-p{password}')

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if db_name in result.stdout:
            print_status(f"Database '{db_name}' exists", True)
            return True
        else:
            print_status(f"Database '{db_name}' exists", False, "Database not found")

            # Create database
            print(f"\n  Creating database '{db_name}'...")
            create_cmd = [
                'mysql', '-h', host, '-P', port, '-u', user, '-e',
                f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            ]
            if password:
                create_cmd.insert(4, f'-p{password}')

            result = subprocess.run(create_cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print_status(f"Database '{db_name}' created", True)
                return True
            else:
                print_status(f"Database '{db_name}' created", False, result.stderr.strip())
                return False
    except Exception as e:
        print_status(f"Database check", False, str(e))
        return False


def check_python_mysql_driver():
    """Check if Python MySQL driver is installed."""
    print_header("Step 3: Checking Python MySQL Driver")

    # Try mysqlclient first (preferred)
    try:
        import MySQLdb
        print_status("mysqlclient installed", True, "Using native MySQL driver")
        return True
    except ImportError:
        print_status("mysqlclient installed", False)

    # Try PyMySQL as alternative
    try:
        import pymysql
        print_status("PyMySQL installed", True, "Using pure Python driver")
        print("\n  NOTE: PyMySQL works but mysqlclient is faster.")
        print("        To use PyMySQL, add this to manage.py at the top:")
        print("        import pymysql")
        print("        pymysql.install_as_MySQLdb()")
        return True
    except ImportError:
        print_status("PyMySQL installed", False)

    print("\n  TIP: Install MySQL driver:")
    print("       pip install mysqlclient")
    print("       OR")
    print("       pip install pymysql")
    return False


def check_django_connection():
    """Test Django database connection."""
    print_header("Step 4: Testing Django Connection")

    try:
        # Setup Django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
        import django
        django.setup()

        from django.db import connection

        # Test connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION();")
            version = cursor.fetchone()[0]
            print_status("Django database connection", True, f"MySQL {version}")

        # Check tables
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            if tables:
                print_status(f"Database has {len(tables)} tables", True)
            else:
                print_status("Database is empty", True, "Run migrations: python manage.py migrate")

        return True

    except Exception as e:
        print_status("Django database connection", False, str(e))
        return False


def print_env_summary():
    """Print current environment configuration."""
    print_header("Environment Configuration")

    print(f"  DATABASE_ENGINE:   {os.getenv('DATABASE_ENGINE', 'Not set')}")
    print(f"  DATABASE_NAME:     {os.getenv('DATABASE_NAME', 'Not set')}")
    print(f"  DATABASE_USER:     {os.getenv('DATABASE_USER', 'Not set')}")
    print(f"  DATABASE_PASSWORD: {'***' if os.getenv('DATABASE_PASSWORD') else '(empty)'}")
    print(f"  DATABASE_HOST:     {os.getenv('DATABASE_HOST', 'Not set')}")
    print(f"  DATABASE_PORT:     {os.getenv('DATABASE_PORT', 'Not set')}")


def main():
    """Run all verification checks."""
    print("\n" + "=" * 50)
    print(" MySQL XAMPP Verification for Django ERP")
    print("=" * 50)

    print_env_summary()

    all_passed = True

    # Step 1: Check MySQL server
    if not check_mysql_running():
        all_passed = False
        print("\n>>> Please start MySQL in XAMPP Control Panel and try again <<<")
        return False

    # Step 2: Check database
    if not check_database_exists():
        all_passed = False

    # Step 3: Check Python driver
    if not check_python_mysql_driver():
        all_passed = False

    # Step 4: Test Django connection
    if not check_django_connection():
        all_passed = False

    # Summary
    print_header("Summary")
    if all_passed:
        print("  All checks passed!")
        print("\n  Next steps:")
        print("    1. python manage.py migrate")
        print("    2. python manage.py createsuperuser")
        print("    3. python manage.py runserver")
    else:
        print("  Some checks failed. Please fix the issues above.")

    return all_passed


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
