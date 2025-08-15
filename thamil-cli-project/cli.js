#!/usr/bin/env node

const { Command } = require('commander');
const fetch = require('node-fetch');
const { sync } = require('cross-spawn'); // Use cross-spawn for cross-platform
const inquirer = require('inquirer'); // For user confirmation
const os = require('os'); // For system checks

const program = new Command();

program
  .name('thamil')
  .description('CLI to fetch and run commands from backend')
  .version('0.1.0');

program
  .argument('<keyword>', 'Keyword of command preset to run')
  .action(async (keyword) => {
    try {
      // Basic system check (RAM)
      const ramGB = os.totalmem() / (1024 ** 3);
      if (ramGB < 4) console.warn('Low RAM (<4GB) detected. Setup may be slow.');

      const url = `http://thamil-cli-tool.onrender.com/commands/${keyword}`; // Local testing URL
      console.log('Fetching command preset from:', url);

      const res = await fetch(url);
      console.log('Response status:', res.status);

      if (!res.ok) {
        console.error(`Command preset "${keyword}" not found.`);
        process.exit(1);
      }

      const cmdData = await res.json();
      console.log('Command data received:', cmdData);

      // User confirmation
      const { confirm } = await inquirer.prompt([{ type: 'confirm', name: 'confirm', message: 'Run these commands?' }]);
      if (!confirm) process.exit(0);

      // Check and handle prerequisites
      for (const p of cmdData.prerequisites || []) {
        try {
          const output = sync('sh', ['-c', p.check], { encoding: 'utf8', stdio: 'pipe' });
          if (!output.trim()) throw new Error('Not installed');
          console.log(`Prerequisite check passed: ${p.check}`);
        } catch {
          console.log(`Installing prerequisite: ${p.install}`);
          sync('sh', ['-c', p.install], { stdio: 'inherit' });
        }
      }

      // Execute commands sequentially
      for (const c of cmdData.commands) {
        console.log(`\nRunning: ${c}`);
        const cmd = process.platform === 'win32' ? 'cmd' : 'sh';
        const args = process.platform === 'win32' ? ['/c', c] : ['-c', c];
        sync(cmd, args, { stdio: 'inherit' });
      }

      console.log('\n✅ All commands executed successfully!');
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);