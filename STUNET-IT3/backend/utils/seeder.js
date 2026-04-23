// utils/seeder.js — Seed sample competitions & announcements
// Run: node utils/seeder.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose     = require('mongoose');
const Competition  = require('../models/Competition');
const Announcement = require('../models/Announcement');

const competitions = [
  {
    name: 'Smart India Hackathon 2025',
    description: 'India\'s biggest hackathon. Build solutions for real government problems. Open to all college students.',
    category: 'Hackathon',
    status: 'active',
    prizePool: '₹1,00,000',
    registrationDeadline: new Date('2025-04-30'),
    startDate: new Date('2025-05-15'),
    endDate:   new Date('2025-05-16'),
    officialUrl: 'https://sih.gov.in',
    organiser: 'Government of India',
    teamSizeMin: 6, teamSizeMax: 6,
    isFeatured: true,
    tags: ['AI', 'Civic', 'National'],
  },
  {
    name: 'HackDreamUp 2025',
    description: 'Build the future of EdTech. 48-hour hackathon with mentors from top startups.',
    category: 'Hackathon',
    status: 'active',
    prizePool: '₹2,00,000',
    registrationDeadline: new Date('2025-03-15'),
    startDate: new Date('2025-03-22'),
    endDate:   new Date('2025-03-24'),
    officialUrl: 'https://hackdreamup.io',
    organiser: 'DreamUp Foundation',
    teamSizeMin: 2, teamSizeMax: 5,
    isFeatured: true,
    tags: ['EdTech', 'AI', 'Mobile'],
  },
  {
    name: 'StartUp Pitch Challenge',
    description: 'Present your startup idea to investors. Win funding and mentorship from top VCs.',
    category: 'Pitch',
    status: 'upcoming',
    prizePool: '₹5,00,000 + Funding',
    registrationDeadline: new Date('2025-03-08'),
    startDate: new Date('2025-04-01'),
    endDate:   new Date('2025-04-01'),
    officialUrl: 'https://example.com/pitch',
    organiser: 'IIT Delhi E-Cell',
    teamSizeMin: 1, teamSizeMax: 4,
    tags: ['Business', 'Pitch', 'Startup'],
  },
  {
    name: 'UI/UX Design Marathon',
    description: 'A 24-hour design challenge. Create stunning interfaces for a real product brief.',
    category: 'Design',
    status: 'upcoming',
    prizePool: '₹50,000',
    registrationDeadline: new Date('2025-04-10'),
    startDate: new Date('2025-04-20'),
    endDate:   new Date('2025-04-21'),
    officialUrl: 'https://example.com/design',
    organiser: 'Figma India Community',
    teamSizeMin: 1, teamSizeMax: 3,
    tags: ['Design', 'Figma', 'UX'],
  },
  {
    name: 'ETH India Web3 Hackathon',
    description: 'Build decentralised applications on Ethereum. Grants, prizes, and bounties available.',
    category: 'Web3',
    status: 'active',
    prizePool: '$50,000 in ETH',
    registrationDeadline: new Date('2025-05-01'),
    startDate: new Date('2025-05-10'),
    endDate:   new Date('2025-05-12'),
    officialUrl: 'https://ethindia.co',
    organiser: 'Devfolio',
    teamSizeMin: 1, teamSizeMax: 4,
    tags: ['Web3', 'Ethereum', 'DeFi'],
  },
];

const announcements = [
  {
    title: 'Welcome to STUNET Beta! 🎉',
    body: 'We just launched. Explore competitions, find teammates, and share your projects. Let\'s build something amazing together.',
    type: 'success',
    pinned: true,
  },
  {
    title: 'Smart India Hackathon registrations are open',
    body: 'India\'s biggest national hackathon is now accepting team registrations. Form your 6-member team and register before April 30.',
    type: 'competition',
  },
  {
    title: 'New community feature: Forums are live',
    body: 'You can now post in category forums — AI/ML, Team Formation, Web3, and more. Share knowledge and grow together.',
    type: 'info',
  },
  {
    title: 'Maintenance window — March 10, 2–4 AM IST',
    body: 'Brief downtime scheduled for database migrations. Save your work before then.',
    type: 'warning',
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Competition.deleteMany({});
    await Announcement.deleteMany({});

    await Competition.insertMany(competitions);
    await Announcement.insertMany(announcements);

    console.log('🌱 Seeded competitions and announcements');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();