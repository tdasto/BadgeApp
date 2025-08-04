const express = require('express');
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const xml2js = require('xml2js');
const app = express();
const port = 3000;
const secretKey = 'your_jwt_secret'; // Replace with secure key in production
const isDevelopment = process.env.NODE_ENV === 'development';

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const sequelize = new Sequelize('BadgeDB', 'your_mysql_user', 'your_mysql_password', {
  host: 'localhost',
  dialect: 'mysql',
});

// Models
const Guest = sequelize.define('guest', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  badge_number: { type: Sequelize.INTEGER, allowNull: false },
  g_first_name: { type: Sequelize.STRING(35), allowNull: false },
  g_last_name: { type: Sequelize.STRING(35), allowNull: false },
  g_city: { type: Sequelize.STRING(255) },
  g_state: { type: Sequelize.STRING(2) },
  g_yob: { type: Sequelize.INTEGER, validate: { min: 1900, max: 3999 } },
  g_paid: { type: Sequelize.STRING(1), defaultValue: '0' },
  tmp_badge: { type: Sequelize.INTEGER },
  time_in: { type: Sequelize.DATE, allowNull: false },
  time_out: { type: Sequelize.DATE },
}, {
  tableName: 'guest',
  timestamps: false,
});

const Badge = sequelize.define('badges', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  badge_number: { type: Sequelize.INTEGER, allowNull: false, unique: true },
  prefix: { type: Sequelize.STRING(15), allowNull: false },
  first_name: { type: Sequelize.STRING(35), allowNull: false },
  last_name: { type: Sequelize.STRING(35), allowNull: false },
  suffix: { type: Sequelize.STRING(15) },
  address: { type: Sequelize.TEXT, allowNull: false },
  city: { type: Sequelize.STRING(25), allowNull: false },
  state: { type: Sequelize.STRING(10), allowNull: false },
  zip: { type: Sequelize.STRING(10), allowNull: false },
  gender: { type: Sequelize.STRING(2) },
  yob: { type: Sequelize.INTEGER },
  email: { type: Sequelize.STRING(100), allowNull: false },
  email_vrfy: { type: Sequelize.BOOLEAN, defaultValue: false },
  phone: { type: Sequelize.STRING(25), allowNull: false },
  phone_op: { type: Sequelize.STRING(25) },
  ice_contact: { type: Sequelize.STRING(40) },
  ice_phone: { type: Sequelize.STRING(25) },
  mem_type: { type: Sequelize.INTEGER, allowNull: false },
  primary: { type: Sequelize.STRING(11) },
  incep: { type: Sequelize.DATE, allowNull: false },
  expires: { type: Sequelize.DATE },
  qrcode: { type: Sequelize.TEXT },
  wt_date: { type: Sequelize.DATE, allowNull: false },
  wt_instru: { type: Sequelize.STRING(255) },
  remarks: { type: Sequelize.TEXT, allowNull: false },
  status: { type: Sequelize.STRING(10) },
  soft_delete: { type: Sequelize.ENUM('0') },
  created_at: { type: Sequelize.DATE },
  updated_at: { type: Sequelize.DATE },
}, {
  tableName: 'badges',
  timestamps: false,
});

const StoreItem = sequelize.define('store_items', {
  item_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  item: { type: Sequelize.STRING(100), allowNull: false },
  sku: { type: Sequelize.STRING(15) },
  price: { type: Sequelize.DECIMAL(10, 2) },
  type: { type: Sequelize.STRING(45), allowNull: false },
  paren: { type: Sequelize.INTEGER },
  img: { type: Sequelize.STRING(255) },
  stock: { type: Sequelize.INTEGER, defaultValue: 0 },
  kit_items: { type: Sequelize.TEXT },
  active: { type: Sequelize.INTEGER, defaultValue: 0 },
  new_badge: { type: Sequelize.INTEGER, defaultValue: 0 },
  tax_rate: { type: Sequelize.DECIMAL(5, 3), defaultValue: 0.000 },
}, {
  tableName: 'store_items',
  timestamps: false,
});

const Param = sequelize.define('params', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  sell_date: { type: Sequelize.STRING(5), allowNull: false },
  guest_sku: { type: Sequelize.INTEGER, defaultValue: 460130 },
  guest_total: { type: Sequelize.INTEGER, defaultValue: 50 },
  status: { type: Sequelize.ENUM('active', 'disabled'), allowNull: false },
  pp_id: { type: Sequelize.STRING(82) }, // Obsolete (PayPal)
  pp_sec: { type: Sequelize.STRING(82) }, // Obsolete (PayPal)
  conv_p_merc_id: { type: Sequelize.STRING(82) }, // Production Merchant ID
  conv_p_user_id: { type: Sequelize.STRING(82) }, // Production User ID
  conv_p_pin: { type: Sequelize.STRING(82) }, // Production PIN
  conv_d_merc_id: { type: Sequelize.STRING(82) }, // Development Merchant ID
  conv_d_user_id: { type: Sequelize.STRING(82) }, // Development User ID
  conv_d_pin: { type: Sequelize.STRING(82) }, // Development PIN
}, {
  tableName: 'params',
  timestamps: false,
});

const User = sequelize.define('user', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: Sequelize.STRING(255), allowNull: false, unique: true },
  email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
  full_name: { type: Sequelize.STRING(255) },
  company: { type: Sequelize.STRING(45) },
  privilege: { type: Sequelize.STRING(45), allowNull: false },
  status: { type: Sequelize.SMALLINT, defaultValue: 10 },
  badge_number: { type: Sequelize.INTEGER },
  auth_key: { type: Sequelize.STRING(100), allowNull: false },
  password_hash: { type: Sequelize.STRING(255), allowNull: false },
  password_reset_token: { type: Sequelize.STRING(255), unique: true },
  created_at: { type: Sequelize.INTEGER, allowNull: false },
  updated_at: { type: Sequelize.INTEGER, allowNull: false },
  clubs: { type: Sequelize.STRING(255) },
  r_user: { type: Sequelize.STRING(45) },
}, {
  tableName: 'user',
  timestamps: false,
});

const CcReceipt = sequelize.define('cc_receipts', {
  id: { type: Sequelize.STRING(48), primaryKey: true },
  badge_number: { type: Sequelize.INTEGER, allowNull: false },
  tx_date: { type: Sequelize.DATE, allowNull: false },
  tx_type: { type: Sequelize.STRING(10), allowNull: false },
  status: { type: Sequelize.STRING(15) },
  amount: { type: Sequelize.DECIMAL(8, 2), allowNull: false },
  tax: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0.00 },
  authCode: { type: Sequelize.STRING(6) },
  name: { type: Sequelize.STRING(50), allowNull: false },
  cardNum: { type: Sequelize.STRING(22) },
  cardType: { type: Sequelize.STRING(20) },
  expYear: { type: Sequelize.INTEGER },
  expMonth: { type: Sequelize.INTEGER },
  cashier: { type: Sequelize.STRING(50), allowNull: false },
  cashier_badge: { type: Sequelize.INTEGER },
  on_qb: { type: Sequelize.INTEGER, defaultValue: 0 },
  cart: { type: Sequelize.TEXT, allowNull: false },
  guest_cred: { type: Sequelize.INTEGER, defaultValue: 0 },
}, {
  tableName: 'cc_receipts',
  timestamps: false,
});

const Club = sequelize.define('clubs', {
  club_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  club_name: { type: Sequelize.STRING(255), allowNull: false },
  short_name: { type: Sequelize.STRING(20), allowNull: false },
  poc_email: { type: Sequelize.STRING(255) },
  status: { type: Sequelize.INTEGER, allowNull: false },
  is_club: { type: Sequelize.INTEGER, defaultValue: 0 },
  allow_members: { type: Sequelize.INTEGER, defaultValue: 1 },
  avoid: { type: Sequelize.STRING(100), defaultValue: '' },
}, {
  tableName: 'clubs',
  timestamps: false,
});

// Authentication Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Parse User Barcode
const parseUserBarcode = async (barcode) => {
  const regex = /^(\d{2})\s(\d{2})\s(\d{5})\s([A-Z0-9]{2})$/;
  const match = barcode.match(regex);
  if (!match) throw new Error('Invalid barcode format');
  const [, club_id, mem_type, badge_number, random] = match;
  const badge = await Badge.findOne({ where: { badge_number: parseInt(badge_number), qrcode: barcode } });
  if (!badge) throw new Error('Badge not found');
  const club = await Club.findOne({ where: { club_id: parseInt(club_id) } });
  if (!club) throw new Error('Invalid club ID');
  if (badge.mem_type !== parseInt(mem_type)) throw new Error('Invalid membership type');
  return { club_id: parseInt(club_id), mem_type: parseInt(mem_type), badge_number: parseInt(badge_number), random };
};

// Generate Random tmp_badge
const generateTmpBadge = async () => {
  let tmp_badge;
  let exists;
  do {
    tmp_badge = Math.floor(10000000 + Math.random() * 90000000); // 8-digit random number
    exists = await Guest.findOne({ where: { tmp_badge } });
  } while (exists);
  return tmp_badge;
};

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { username, barcode } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      await sequelize.query(
        'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
        {
          replacements: {
            date: new Date(),
            module: 'guest',
            name: username,
            ip: req.ip,
            status: 'failed: Invalid badge number',
          },
        }
      );
      return res.status(401).json({ error: 'Invalid badge number' });
    }
    const badge = await Badge.findOne({ where: { badge_number: user.badge_number } });
    if (!badge || !bcrypt.compareSync(barcode, user.password_hash)) {
      await sequelize.query(
        'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
        {
          replacements: {
            date: new Date(),
            module: 'guest',
            name: username,
            ip: req.ip,
            status: 'failed: Invalid barcode',
          },
        }
      );
      return res.status(401).json({ error: 'Invalid barcode' });
    }
    await parseUserBarcode(barcode); // Validate barcode format
    const token = jwt.sign({ username, privilege: user.privilege, badge_number: user.badge_number }, secretKey, { expiresIn: '1h' });
    await sequelize.query(
      'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
      {
        replacements: {
          date: new Date(),
          module: 'guest',
          name: username,
          ip: req.ip,
          status: 'success',
        },
      }
    );
    res.json({ user: { username, privilege: user.privilege, badge_number: user.badge_number }, token });
  } catch (error) {
    console.error('Login failed:', error.message);
    await sequelize.query(
      'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
      {
        replacements: {
          date: new Date(),
          module: 'guest',
          name: username || 'unknown',
          ip: req.ip,
          status: `failed: ${error.message}`,
        },
      }
    );
    res.status(401).json({ error: error.message });
  }
});

// Get Config (Guest SKU)
app.get('/api/config/guest_sku', authenticate, async (req, res) => {
  try {
    const param = await Param.findByPk(1);
    const item = await StoreItem.findOne({ where: { sku: param.guest_sku } });
    if (!item) return res.status(404).json({ error: 'Guest SKU not found' });
    res.json({ price: item.price, tax_rate: item.tax_rate });
  } catch (error) {
    console.error('Fetch config failed:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Get Badge Info
app.get('/api/badges/:badge_number', authenticate, async (req, res) => {
  try {
    const badge = await Badge.findOne({ where: { badge_number: req.params.badge_number } });
    if (!badge) return res.status(404).json({ status: 'error', message: 'Badge not found' });
    res.json({
      status: 'success',
      badge_number: badge.badge_number,
      prefix: badge.prefix,
      first_name: badge.first_name,
      last_name: badge.last_name,
      suffix: badge.suffix,
      address: badge.address,
      city: badge.city,
      state: badge.state,
      zip: badge.zip,
      email: badge.email,
      phone: badge.phone,
    });
  } catch (error) {
    console.error('Fetch badge failed:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch badge' });
  }
});

// Validate tmp_badge for Access Control
app.get('/api/guests/validate-tmp-badge/:tmp_badge', authenticate, async (req, res) => {
  try {
    const guest = await Guest.findOne({
      where: {
        tmp_badge: req.params.tmp_badge,
        time_out: null,
        [Sequelize.where(Sequelize.fn('DATE', Sequelize.col('time_in')), Sequelize.fn('CURDATE'))]: true,
      },
    });
    if (!guest) return res.status(404).json({ status: 'error', message: 'Guest not found, checked out, or tmp_badge expired' });
    res.json({
      status: 'success',
      guest: {
        id: guest.id,
        badge_number: guest.badge_number,
        g_first_name: guest.g_first_name,
        g_last_name: guest.g_last_name,
        time_in: guest.time_in,
      },
    });
  } catch (error) {
    console.error('Validate tmp_badge failed:', error);
    res.status(500).json({ status: 'error', message: 'Failed to validate tmp_badge' });
  }
});

// List Guests
app.get('/api/guests', authenticate, async (req, res) => {
  const { pageSize = 20, badge_number, atRange_condition } = req.query;
  const where = {};
  if (req.user.privilege !== 'admin' && badge_number) where.badge_number = badge_number;
  if (atRange_condition === 'atRange') where.time_out = null;
  if (atRange_condition === 'gone') where.time_out = { [Sequelize.Op.ne]: null };
  try {
    const guests = await Guest.findAll({
      where,
      limit: parseInt(pageSize),
      order: [['time_in', 'DESC']],
    });
    res.json(guests);
  } catch (error) {
    console.error('Fetch guests failed:', error);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

// Create Guest
app.post('/api/guests', authenticate, async (req, res) => {
  if (req.user.privilege !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const tmp_badge = await generateTmpBadge();
    const guest = await Guest.create({
      ...req.body,
      g_first_name: req.body.g_first_name.trim(),
      g_last_name: req.body.g_last_name.trim(),
      g_city: req.body.g_city?.trim(),
      g_state: req.body.g_state?.trim().toUpperCase(),
      tmp_badge,
      time_in: new Date(req.body.time_in),
    });
    await sequelize.query(
      'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
      {
        replacements: {
          date: new Date(),
          module: 'guest',
          name: req.user.username,
          ip: req.ip,
          status: `Added Guest: ${guest.g_first_name} for Badge: ${guest.badge_number} with tmp_badge: ${tmp_badge}`,
        },
      }
    );
    res.json(guest);
  } catch (error) {
    console.error('Create guest failed:', error);
    res.status(500).json({ error: 'Failed to create guest', errors: error.errors });
  }
});

// Update Guest
app.put('/api/guests/:id', authenticate, async (req, res) => {
  if (req.user.privilege !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const guest = await Guest.findByPk(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    const tmp_badge = req.body.tmp_badge ? await generateTmpBadge() : guest.tmp_badge;
    await guest.update({
      ...req.body,
      g_first_name: req.body.g_first_name.trim(),
      g_last_name: req.body.g_last_name.trim(),
      g_city: req.body.g_city?.trim(),
      g_state: req.body.g_state?.trim().toUpperCase(),
      tmp_badge,
      time_in: new Date(req.body.time_in),
    });
    await sequelize.query(
      'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
      {
        replacements: {
          date: new Date(),
          module: 'guest',
          name: req.user.username,
          ip: req.ip,
          status: `Updated Guest: ${guest.g_first_name} for Badge: ${guest.badge_number} with tmp_badge: ${tmp_badge}`,
        },
      }
    );
    res.json(guest);
  } catch (error) {
    console.error('Update guest failed:', error);
    res.status(500).json({ error: 'Failed to update guest', errors: error.errors });
  }
});

// Delete Guest
app.delete('/api/guests/:id', authenticate, async (req, res) => {
  if (req.user.privilege !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const guest = await Guest.findByPk(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    await guest.destroy();
    await sequelize.query(
      'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
      {
        replacements: {
          date: new Date(),
          module: 'guest',
          name: req.user.username,
          ip: req.ip,
          status: `Deleted Guest: ${guest.id} Name: ${guest.g_first_name} of Badge: ${guest.badge_number}`,
        },
      }
    );
    res.json({ message: 'Guest deleted' });
  } catch (error) {
    console.error('Delete guest failed:', error);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});

// Check Out Guest
app.post('/api/guests/:id/out', authenticate, async (req, res) => {
  if (req.user.privilege !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const guest = await Guest.findByPk(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    guest.time_out = new Date();
    await guest.save();
    await sequelize.query(
      'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
      {
        replacements: {
          date: new Date(),
          module: 'guest',
          name: req.user.username,
          ip: req.ip,
          status: `Checked Out Guest: ${guest.id}`,
        },
      }
    );
    res.json({ message: 'Guest checked out' });
  } catch (error) {
    console.error('Check out failed:', error);
    res.status(500).json({ error: 'Failed to check out guest' });
  }
});

// Process Payment
app.post('/api/payment/charge', authenticate, async (req, res) => {
  if (req.user.privilege !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const { badge_number, cc_name, cc_num, cc_cvc, cc_exp_mo, cc_exp_yr, cc_address, cc_city, cc_state, cc_zip, amount_due, guest_count } = req.body;
    const param = await Param.findByPk(1);
    const item = await StoreItem.findOne({ where: { sku: param.guest_sku } });
    if (!item) return res.status(404).json({ error: 'Guest SKU not found' });

    // Select Converge credentials based on environment
    const merchantId = isDevelopment ? param.conv_d_merc_id : param.conv_p_merc_id;
    const userId = isDevelopment ? param.conv_d_user_id : param.conv_p_user_id;
    const pin = isDevelopment ? param.conv_d_pin : param.conv_p_pin;

    if (!merchantId || !userId || !pin) {
      return res.status(400).json({ status: 'error', message: `Converge ${isDevelopment ? 'development' : 'production'} credentials missing in params` });
    }

    // Validate inputs
    if (!cc_num || !/^\d+$/.test(cc_num)) return res.status(400).json({ status: 'error', message: 'Please Verify Credit Card Number' });
    if (!cc_cvc) return res.status(400).json({ status: 'error', message: 'Please Verify CVC' });
    if (!cc_name) return res.status(400).json({ status: 'error', message: 'Please Verify Name' });
    if (!cc_address) return res.status(400).json({ status: 'error', message: 'Please Verify Address' });
    if (!cc_city) return res.status(400).json({ status: 'error', message: 'Please Verify City' });
    if (!cc_state) return res.status(400).json({ status: 'error', message: 'Please Verify State' });
    if (!cc_zip) return res.status(400).json({ status: 'error', message: 'Please Verify Zip Code' });
    if (!amount_due || amount_due <= 0) return res.status(400).json({ status: 'error', message: 'Please Verify Amount Due' });

    // Build XML payload
    const [firstName, ...lastNameParts] = cc_name.split(' ');
    const lastName = lastNameParts.join(' ');
    const expDate = `${cc_exp_mo}${cc_exp_yr.toString().slice(-2)}`;
    const xmlBuilder = new xml2js.Builder({ rootName: 'txn' });
    const xmlPayload = xmlBuilder.buildObject({
      ssl_merchant_id: merchantId,
      ssl_user_id: userId,
      ssl_pin: pin,
      ssl_transaction_type: 'ccsale',
      ssl_card_number: cc_num,
      ssl_cvv2cvc2: cc_cvc,
      ssl_exp_date: expDate,
      ssl_amount: Number(amount_due).toFixed(2),
      ssl_avs_zip: cc_zip,
      ssl_avs_address: cc_address,
      ssl_city: cc_city,
      ssl_state: cc_state,
      ssl_first_name: firstName,
      ssl_last_name: lastName,
    });

    // Send request to Converge
    const url = isDevelopment
      ? 'https://api.demo.convergepay.com/VirtualMerchantDemo/processxml.do'
      : 'https://api.convergepay.com/VirtualMerchant/processxml.do';
    const response = await axios.post(url, xmlPayload, {
      headers: { 'Content-Type': 'text/xml' },
    });

    // Parse XML response
    const parsedResponse = await xml2js.parseStringPromise(response.data);
    const result = parsedResponse.txn || {};

    if (result.ssl_result_message && result.ssl_result_message[0] === 'APPROVAL') {
      const receiptId = result.ssl_txn_id[0];
      const receipt = await CcReceipt.create({
        id: receiptId,
        badge_number,
        tx_date: new Date(),
        tx_type: 'creditnow',
        status: 'APPROVED',
        amount: parseFloat(amount_due),
        tax: (parseFloat(amount_due) - (parseFloat(amount_due) / (1 + item.tax_rate))).toFixed(2),
        authCode: result.ssl_approval_code[0],
        name: cc_name,
        cardNum: result.ssl_card_number[0], // Masked card number
        cardType: result.ssl_card_short_description[0],
        expYear: parseInt(expDate.slice(2)),
        expMonth: parseInt(expDate.slice(0, 2)),
        cashier: req.user.username,
        cashier_badge: req.user.badge_number || 0,
        on_qb: 0,
        cart: JSON.stringify([{ item: 'Guest Bracelet Fee', sku: param.guest_sku, ea: (amount_due / guest_count).toFixed(2), qty: guest_count, price: amount_due }]),
        guest_cred: 1,
      });

      await sequelize.query(
        'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
        {
          replacements: {
            date: new Date(),
            module: 'payment',
            name: req.user.username,
            ip: req.ip,
            status: `Processed CC for ${cc_name} $${amount_due}, AuthCode: ${receipt.authCode}, Card: ${receipt.cardNum}`,
          },
        }
      );

      res.json({
        status: 'success',
        message: {
          status: 'APPROVED',
          authCode: receipt.authCode,
          id: receipt.id,
        },
      });
    } else if (result.ssl_result_message && result.ssl_result_message[0]) {
      await sequelize.query(
        'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
        {
          replacements: {
            date: new Date(),
            module: 'payment',
            name: req.user.username,
            ip: req.ip,
            status: `CC Error for ${cc_name}: ${result.ssl_result_message[0]}`,
          },
        }
      );
      res.status(400).json({ status: 'error', message: result.ssl_result_message[0] });
    } else if (result.errorCode && result.errorCode[0]) {
      await sequelize.query(
        'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
        {
          replacements: {
            date: new Date(),
            module: 'payment',
            name: req.user.username,
            ip: req.ip,
            status: `CC Error: ${result.errorCode[0]} ${result.errorName[0]}`,
          },
        }
      );
      res.status(400).json({ status: 'error', message: `Error# ${result.errorCode[0]}: ${result.errorMessage[0]}` });
    } else {
      await sequelize.query(
        'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
        {
          replacements: {
            date: new Date(),
            module: 'payment',
            name: req.user.username,
            ip: req.ip,
            status: `CC Error: No Response or Network Timeout for ${cc_name}`,
          },
        }
      );
      res.status(500).json({ status: 'error', message: 'No Response or Network Timed Out. Please use a different payment method or try again later.' });
    }
  } catch (error) {
    console.error('Payment failed:', error.message);
    await sequelize.query(
      'INSERT INTO login_access_badgeapp (l_date, module, l_name, ip, l_status) VALUES (:date, :module, :name, :ip, :status)',
      {
        replacements: {
          date: new Date(),
          module: 'payment',
          name: req.user.username || 'unknown',
          ip: req.ip,
          status: `Payment Error: ${error.message}`,
        },
      }
    );
    res.status(500).json({ status: 'error', message: 'Payment processing failed' });
  }
});

// Guest Stats
app.get('/api/guests/stats', authenticate, async (req, res) => {
  if (req.user.privilege !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { time_in_start, time_in_end, limit = 250 } = req.query;
  const where = `WHERE time_in >= '${time_in_start} 00:00:00' AND time_in <= '${time_in_end} 23:59:59'`;
  try {
    const [paidResult, totalResult, badgeResult] = await Promise.all([
      sequelize.query(`SELECT COUNT(*) as cnt, g_paid FROM guest ${where} GROUP BY g_paid`),
      sequelize.query(`SELECT COUNT(DISTINCT id) as totalGuests, COUNT(DISTINCT badge_number) as totalMembers FROM guest ${where}`),
      sequelize.query(`
        SELECT g.badge_number, COUNT(*) as cnt, COUNT(DISTINCT g.id) as guestCount, GROUP_CONCAT(g.g_first_name) as frequency
        FROM guest g ${where}
        GROUP BY g.badge_number
        ORDER BY cnt DESC
        LIMIT ${parseInt(limit)}
      `),
    ]);
    const stats = {
      totalGuests: totalResult[0][0].totalGuests,
      totalMembers: totalResult[0][0].totalMembers,
      paying: paidResult[0].find(r => r.g_paid === '1')?.cnt || 0,
      spouse: paidResult[0].find(r => r.g_paid === 's')?.cnt || 0,
      minor: paidResult[0].find(r => r.g_paid === 'm')?.cnt || 0,
      youth: paidResult[0].find(r => r.g_paid === 'y')?.cnt || 0,
      observer: paidResult[0].find(r => r.g_paid === 'o')?.cnt || 0,
      badgeStats: badgeResult[0].map(stat => ({
        badge_number: stat.badge_number,
        cnt: stat.cnt,
        guestCount: stat.guestCount,
        frequency: stat.frequency.split(',').filter((v, i, a) => a.indexOf(v) === i).join(', '),
        becameMember: null, // Placeholder; join with badges for incep if needed
      })),
    };
    res.json(stats);
  } catch (error) {
    console.error('Fetch stats failed:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get Violations
app.get('/api/violations', authenticate, async (req, res) => {
  if (req.user.privilege !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const violations = await sequelize.query(
      'SELECT * FROM violations WHERE was_guest = 1',
      { type: Sequelize.QueryTypes.SELECT }
    );
    res.json(violations);
  } catch (error) {
    console.error('Fetch violations failed:', error);
    res.status(500).json({ error: 'Failed to fetch violations' });
  }
});

// Start Server
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
