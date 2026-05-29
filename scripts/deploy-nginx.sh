#!/bin/bash

# Deploy nginx configuration to AWS

echo "📝 Updating nginx configuration..."

# Copy nginx config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Create new config
sudo tee /etc/nginx/sites-available/default > /dev/null <<'EOF'
server {

    server_name idovacancy.in www.idovacancy.in;
    client_max_body_size 50M;
    
    # Upload App
    root /var/www/upload;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Search App
    location /search/ {
        alias /var/www/search/;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Connection "upgrade";
        proxy_set_header Upgrade $http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/idovacancy.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/idovacancy.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

}

server {
    if ($host = www.idovacancy.in) {
        return 301 https://$host$request_uri;
    }

    if ($host = idovacancy.in) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name idovacancy.in www.idovacancy.in;
    return 404;
}
EOF

# Test nginx config
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx config has errors, restoring backup"
    sudo cp /etc/nginx/sites-available/default.backup /etc/nginx/sites-available/default
    exit 1
fi
