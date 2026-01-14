-- ============================================
-- MySQL Database Setup Script
-- ERP E-Commerce Platform
-- ============================================

-- Run this script as MySQL root user:
-- mysql -u root -p < scripts/mysql_setup.sql

-- ============================================
-- Create Database
-- ============================================
CREATE DATABASE IF NOT EXISTS erp_ecommerce 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Create Application User (Optional but Recommended)
-- ============================================
-- Replace 'your_secure_password' with a strong password

CREATE USER IF NOT EXISTS 'erp_user'@'localhost' 
    IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON erp_ecommerce.* TO 'erp_user'@'localhost';

-- For remote connections (if needed)
-- CREATE USER IF NOT EXISTS 'erp_user'@'%' 
--     IDENTIFIED BY 'your_secure_password';
-- GRANT ALL PRIVILEGES ON erp_ecommerce.* TO 'erp_user'@'%';

-- Apply privileges
FLUSH PRIVILEGES;

-- ============================================
-- Verify Setup
-- ============================================
SHOW DATABASES LIKE 'erp_ecommerce';
SELECT User, Host FROM mysql.user WHERE User = 'erp_user';

-- ============================================
-- Usage Notes
-- ============================================
-- 
-- After running this script, update your .env file:
--
-- DATABASE_ENGINE=django.db.backends.mysql
-- DATABASE_NAME=erp_ecommerce
-- DATABASE_USER=erp_user
-- DATABASE_PASSWORD=your_secure_password
-- DATABASE_HOST=localhost
-- DATABASE_PORT=3306
--
-- Then run Django migrations:
-- python manage.py migrate
--
