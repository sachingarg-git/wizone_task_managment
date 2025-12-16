# Running npm permanently with PM2

## Install PM2 globally
```powershell
npm install -g pm2
```

## Start the application with PM2
```powershell
cd "d:\Sachin Garg Profile\New folder\ppll11\TaskScoreTracker"
pm2 start npm --name "task-tracker" -- run dev
```

## Useful PM2 commands
```powershell
# View running processes
pm2 list

# View logs
pm2 logs task-tracker

# Stop the application
pm2 stop task-tracker

# Restart the application
pm2 restart task-tracker

# Delete from PM2
pm2 delete task-tracker

# Make PM2 auto-start on system boot
pm2 startup
pm2 save
```

## Or use Windows Service (Alternative)

### Install node-windows
```powershell
npm install -g node-windows
```

Then create a service script to run it as a Windows service.
