#!/usr/bin/env node

const { Command } = require('commander');
const fetch = require('node-fetch');
const { execSync } = require('child_process');

const program = new Command();

program
  .name('thamil')
  .description('CLI to fetch and run commands from backend')
  .version('0.1.0');

program
  .argument('<keyword>', 'Keyword of command preset to run')
  .action(async (keyword) => {
    try {
      const url = `https://thamil-cli-tool.onrender.com/commands/${keyword}`;
      console.log('Fetching command preset from:', url);

      const res = await fetch(url);
      console.log('Response status:', res.status);

      if (!res.ok) {
        console.error(`Command preset "${keyword}" not found.`);
        process.exit(1);
      }

      const cmdData = await res.json();
      console.log('Command data received:', cmdData);

      // Check and install prerequisites
      for (const p of cmdData.prerequisites || []) {
        try {
          execSync(p.check, { stdio: 'ignore' });
          console.log(`Prerequisite check passed: ${p.check}`);
        } catch {
          console.log(`Installing prerequisite: ${p.install}`);
          execSync(p.install, { stdio: 'inherit' });
        }
      }

      // Execute commands sequentially
      for (const c of cmdData.commands) {
        console.log(`\nRunning: ${c}`);
        execSync(c, { stdio: 'inherit' });
      }

      console.log('\n✅ All commands executed successfully!');
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
