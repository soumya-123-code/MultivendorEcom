"""
PyMySQL Setup Helper

If you're having trouble installing mysqlclient (requires compilation),
you can use PyMySQL as a drop-in replacement.

Usage:
1. pip install PyMySQL
2. Add this import to manage.py and wsgi.py (before other imports):
   
   import pymysql
   pymysql.install_as_MySQLdb()

Or simply run this script to auto-patch the files:
   python scripts/setup_pymysql.py
"""

import os
import sys

def patch_file(filepath, patch_code):
    """Add PyMySQL patch to the beginning of a file."""
    
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if already patched
    if 'pymysql.install_as_MySQLdb()' in content:
        print(f"Already patched: {filepath}")
        return True
    
    # Add patch after the first line (shebang or encoding declaration)
    lines = content.split('\n')
    
    # Find insertion point (after shebang/encoding)
    insert_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('#!') or line.startswith('# -*-'):
            insert_idx = i + 1
        else:
            break
    
    # Insert the patch
    patch_lines = [
        '',
        '# PyMySQL patch - Use PyMySQL as MySQLdb replacement',
        'import pymysql',
        'pymysql.install_as_MySQLdb()',
        '',
    ]
    
    for i, patch_line in enumerate(patch_lines):
        lines.insert(insert_idx + i, patch_line)
    
    new_content = '\n'.join(lines)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    print(f"Patched: {filepath}")
    return True


def main():
    """Patch manage.py and wsgi.py for PyMySQL usage."""
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    files_to_patch = [
        os.path.join(base_dir, 'manage.py'),
        os.path.join(base_dir, 'config', 'wsgi.py'),
        os.path.join(base_dir, 'config', 'asgi.py'),
    ]
    
    print("PyMySQL Setup Helper")
    print("=" * 40)
    print()
    print("This will patch your Django files to use PyMySQL")
    print("as a drop-in replacement for mysqlclient.")
    print()
    
    # Check if PyMySQL is installed
    try:
        import pymysql
        print(f"✓ PyMySQL is installed (version {pymysql.__version__})")
    except ImportError:
        print("✗ PyMySQL is not installed!")
        print("  Run: pip install PyMySQL")
        sys.exit(1)
    
    print()
    print("Patching files...")
    
    for filepath in files_to_patch:
        patch_file(filepath, '')
    
    print()
    print("Done! You can now use MySQL with PyMySQL.")
    print()
    print("Make sure your .env file has:")
    print("  DATABASE_ENGINE=django.db.backends.mysql")
    print("  DATABASE_NAME=erp_ecommerce")
    print("  DATABASE_USER=your_user")
    print("  DATABASE_PASSWORD=your_password")


if __name__ == '__main__':
    main()
