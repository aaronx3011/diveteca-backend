CREATE TABLE [desarrollo].[dbo].[Users] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    force_password_reset BIT NOT NULL DEFAULT 0,
    password_reset_expires_at DATETIME2 NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE [desarrollo].[dbo].[Sessions] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY REFERENCES [desarrollo].[dbo].[Users](id),
    token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500),
    expires_at DATETIME2 NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE()
);
