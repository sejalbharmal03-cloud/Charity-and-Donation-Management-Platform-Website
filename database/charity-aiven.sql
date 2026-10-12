-- =========================
-- USERS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CAMPAIGNS / PROJECTS
-- =========================
CREATE TABLE IF NOT EXISTS campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    goal DECIMAL(12,2) NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    deadline DATE,
    status ENUM('active', 'closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- DONATIONS
-- =========================
CREATE TABLE IF NOT EXISTS donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    campaign_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Demo Payment',
    transaction_id VARCHAR(100) UNIQUE,
    status ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_donation_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_donation_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id)
        ON DELETE CASCADE
);

-- =========================
-- VOLUNTEERS
-- =========================
CREATE TABLE IF NOT EXISTS volunteers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    interest VARCHAR(150),
    availability VARCHAR(100),
    status ENUM(
        'pending',
        'approved',
        'rejected',
        'inactive'
    ) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SPONSORS
-- =========================
CREATE TABLE IF NOT EXISTS sponsors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(20),
    contribution DECIMAL(12,2) DEFAULT 0,
    website VARCHAR(300),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CONTACT / MESSAGES
-- =========================
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status ENUM('unread', 'read') DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- FEEDBACK
-- =========================
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    rating INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- PROJECT UPDATES
-- =========================
CREATE TABLE IF NOT EXISTS project_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_update_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id)
        ON DELETE CASCADE
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX idx_campaign_status
ON campaigns(status);

CREATE INDEX idx_donation_status
ON donations(status);

CREATE INDEX idx_donation_date
ON donations(created_at);

CREATE INDEX idx_volunteer_status
ON volunteers(status);

CREATE INDEX idx_message_status
ON messages(status);


-- =====================================================
-- DEMO USERS
-- =====================================================

-- Password for demo accounts:
-- Admin: Admin@123
-- User: User@123

INSERT IGNORE INTO users
(name, email, password, phone, role)
VALUES
(
    'CareConnect Admin',
    'admin@careconnect.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    '9876543210',
    'admin'
),
(
    'Demo User',
    'user@careconnect.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    '9876501234',
    'user'
);


-- =====================================================
-- SAMPLE CAMPAIGNS
-- =====================================================

INSERT INTO campaigns
(title, category, description, goal, image_url, deadline, status)
VALUES

(
    'Disaster Relief & Emergency Support',
    'Disaster Relief',
    'Providing emergency food, shelter, medical support and essential supplies to communities affected by natural disasters.',
    500000,
    'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
    '2027-03-31',
    'active'
),

(
    'Save Our Animals',
    'Animal Welfare',
    'Supporting rescue, food, vaccination and medical care for abandoned and injured animals.',
    200000,
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1200&q=80',
    '2027-04-30',
    'active'
),

(
    'Food For Everyone',
    'Food Support',
    'Helping provide nutritious meals and essential groceries to families and communities in need.',
    300000,
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
    '2027-05-31',
    'active'
),

(
    'Education For Every Child',
    'Education',
    'Supporting educational resources, books, learning materials and scholarships for children.',
    400000,
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
    '2027-06-30',
    'active'
),

(
    'Green Earth Initiative',
    'Environment',
    'Promoting tree plantation, environmental awareness and sustainable community development.',
    250000,
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    '2027-07-31',
    'active'
);


-- =====================================================
-- SAMPLE VOLUNTEERS
-- =====================================================

INSERT INTO volunteers
(name, email, phone, interest, availability, status)
VALUES
(
    'Aarav Sharma',
    'aarav@example.com',
    '9876501111',
    'Disaster Relief',
    'Weekends',
    'approved'
),
(
    'Ananya Patil',
    'ananya@example.com',
    '9876502222',
    'Education',
    'Evenings',
    'approved'
),
(
    'Rohan Joshi',
    'rohan@example.com',
    '9876503333',
    'Animal Welfare',
    'Weekends',
    'pending'
),
(
    'Priya Shah',
    'priya@example.com',
    '9876504444',
    'Food Distribution',
    'Flexible',
    'approved'
);


-- =====================================================
-- SAMPLE SPONSORS
-- =====================================================

INSERT INTO sponsors
(name, company, email, phone, contribution, website, status)
VALUES
(
    'Rahul Mehta',
    'Helping Hands Pvt. Ltd.',
    'rahul@helpinghands.example',
    '9876511111',
    75000,
    'https://example.com',
    'active'
),
(
    'Neha Kapoor',
    'Bright Future Foundation',
    'neha@brightfuture.example',
    '9876522222',
    100000,
    'https://example.com',
    'active'
),
(
    'Amit Verma',
    'Green World Foundation',
    'amit@greenworld.example',
    '9876533333',
    50000,
    'https://example.com',
    'active'
);


-- =====================================================
-- SAMPLE DONATIONS
-- =====================================================

INSERT INTO donations
(user_id, campaign_id, amount, payment_method, transaction_id, status)
VALUES
(
    2,
    1,
    5000,
    'Demo Payment',
    'CC-DEMO-1001',
    'completed'
),
(
    2,
    2,
    2500,
    'Demo Payment',
    'CC-DEMO-1002',
    'completed'
),
(
    2,
    3,
    3000,
    'Demo Payment',
    'CC-DEMO-1003',
    'completed'
),
(
    2,
    4,
    4500,
    'Demo Payment',
    'CC-DEMO-1004',
    'completed'
);


-- =====================================================
-- SAMPLE MESSAGES
-- =====================================================

INSERT INTO messages
(name, email, subject, message, status)
VALUES
(
    'Sneha Kulkarni',
    'sneha@example.com',
    'Volunteer Opportunity',
    'I would like to volunteer for upcoming charity activities.',
    'unread'
),
(
    'Vikram Singh',
    'vikram@example.com',
    'Project Information',
    'I would like more information about the disaster relief project.',
    'read'
);


-- =====================================================
-- SAMPLE FEEDBACK
-- =====================================================

INSERT INTO feedback
(name, email, message, rating)
VALUES
(
    'Kavya Deshmukh',
    'kavya@example.com',
    'The platform is simple and informative.',
    5
),
(
    'Aditya More',
    'aditya@example.com',
    'The campaign information is easy to understand.',
    4
);


-- =====================================================
-- PROJECT UPDATES
-- =====================================================

INSERT INTO project_updates
(campaign_id, title, description, image_url, video_url)
VALUES
(
    1,
    'Emergency Supplies Distributed',
    'Essential food and emergency supplies are being prepared for affected communities.',
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
    ''
),
(
    2,
    'Animal Rescue Support',
    'Our volunteers are helping provide food and basic care to rescued animals.',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1200&q=80',
    ''
),
(
    3,
    'Community Food Drive',
    'Food packages are being prepared for distribution to families in need.',
    'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=1200&q=80',
    ''
);


-- =====================================================
-- CHECK DATABASE
-- =====================================================

SELECT 'Users' AS Table_Name, COUNT(*) AS Total FROM users
UNION ALL
SELECT 'Campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'Donations', COUNT(*) FROM donations
UNION ALL
SELECT 'Volunteers', COUNT(*) FROM volunteers
UNION ALL
SELECT 'Sponsors', COUNT(*) FROM sponsors
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages
UNION ALL
SELECT 'Feedback', COUNT(*) FROM feedback
UNION ALL
SELECT 'Project Updates', COUNT(*) FROM project_updates;