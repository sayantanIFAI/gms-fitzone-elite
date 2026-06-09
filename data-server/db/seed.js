const { v4: uuid } = require('uuid');

function dt(dateStr, hour = 9, minute = 0) {
  return `${dateStr}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00.000Z`;
}

function seedDatabase(db) {
  // ─── MEMBERS ───────────────────────────────────────────────────────────────
  const members = [
    { id: 'mem_001', name: 'Jim Fletcher',    email: 'jim.fletcher@email.com',    role: 'member',  avatar_color: '#7c3aed', membership_type: 'premium',  join_date: '2024-01-15', phone: '+44 7700 900001', payment_status: 'active',   mandate_ref: 'BACS-GMS-001', access_locked: 0 },
    { id: 'mem_002', name: 'Susan Clarke',    email: 'susan.clarke@email.com',    role: 'member',  avatar_color: '#06b6d4', membership_type: 'standard', join_date: '2024-03-20', phone: '+44 7700 900002', payment_status: 'active',   mandate_ref: 'BACS-GMS-002', access_locked: 0 },
    { id: 'mem_003', name: 'Akalla Mensah',   email: 'akalla.mensah@fitzone.com', role: 'trainer', avatar_color: '#f59e0b', membership_type: 'staff',    join_date: '2023-09-01', phone: '+44 7700 900003', payment_status: 'active',   mandate_ref: null,           access_locked: 0 },
    { id: 'mem_004', name: 'David Park',      email: 'david.park@fitzone.com',    role: 'admin',   avatar_color: '#10b981', membership_type: 'staff',    join_date: '2023-06-01', phone: '+44 7700 900004', payment_status: 'active',   mandate_ref: null,           access_locked: 0 },
    { id: 'mem_005', name: 'Lisa Ahmed',      email: 'lisa.ahmed@email.com',      role: 'member',  avatar_color: '#ec4899', membership_type: 'standard', join_date: '2024-02-10', phone: '+44 7700 900005', payment_status: 'active',   mandate_ref: 'BACS-GMS-005', access_locked: 0 },
    { id: 'mem_006', name: 'Carlos Reyes',    email: 'carlos.reyes@email.com',    role: 'member',  avatar_color: '#3b82f6', membership_type: 'standard', join_date: '2024-02-28', phone: '+44 7700 900006', payment_status: 'active',   mandate_ref: 'BACS-GMS-006', access_locked: 0 },
    { id: 'mem_007', name: 'Mark Thompson',   email: 'mark.thompson@email.com',   role: 'member',  avatar_color: '#ef4444', membership_type: 'standard', join_date: '2023-11-05', phone: '+44 7700 900007', payment_status: 'defaulted',mandate_ref: 'BACS-GMS-007', access_locked: 0 },
    { id: 'mem_008', name: 'Emma Wilson',     email: 'emma.wilson@email.com',     role: 'member',  avatar_color: '#f97316', membership_type: 'premium',  join_date: '2024-01-08', phone: '+44 7700 900008', payment_status: 'defaulted',mandate_ref: 'BACS-GMS-008', access_locked: 0 },
    { id: 'mem_009', name: 'Tom Richards',    email: 'tom.richards@email.com',    role: 'member',  avatar_color: '#dc2626', membership_type: 'standard', join_date: '2023-08-20', phone: '+44 7700 900009', payment_status: 'defaulted',mandate_ref: 'BACS-GMS-009', access_locked: 1 },
    { id: 'mem_010', name: 'Sarah Chen',      email: 'sarah.chen@email.com',      role: 'member',  avatar_color: '#8b5cf6', membership_type: 'standard', join_date: '2024-04-01', phone: '+44 7700 900010', payment_status: 'active',   mandate_ref: 'BACS-GMS-010', access_locked: 0 },
    { id: 'mem_011', name: "James O'Brien",   email: 'james.obrien@email.com',    role: 'member',  avatar_color: '#14b8a6', membership_type: 'premium',  join_date: '2023-10-15', phone: '+44 7700 900011', payment_status: 'active',   mandate_ref: 'BACS-GMS-011', access_locked: 0 },
  ];

  const insertMember = db.prepare(`INSERT INTO members (id,name,email,role,avatar_color,membership_type,join_date,phone,payment_status,mandate_ref,access_locked) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  members.forEach(m => insertMember.run(m.id, m.name, m.email, m.role, m.avatar_color, m.membership_type, m.join_date, m.phone, m.payment_status, m.mandate_ref, m.access_locked));

  // ─── CLASSES ───────────────────────────────────────────────────────────────
  const classes = [
    { id: 'cls_001', name: 'HIIT Blast',           description: 'High-intensity interval training to maximise calorie burn and cardiovascular fitness.', trainer_id: 'mem_003', schedule_days: 'Mon,Wed,Fri', schedule_time: '07:00', capacity: 20, duration_minutes: 45, location: 'Studio A', category: 'hiit',    color: '#ef4444' },
    { id: 'cls_002', name: 'Functional Fitness',   description: 'Compound movements and mobility work designed for everyday strength and longevity.',    trainer_id: 'mem_003', schedule_days: 'Tue,Thu',    schedule_time: '18:00', capacity: 15, duration_minutes: 60, location: 'Studio B', category: 'strength',color: '#f59e0b' },
    { id: 'cls_003', name: 'Yoga Flow',             description: 'Vinyasa-style yoga class blending breath, movement, and mindfulness.',                 trainer_id: null,      schedule_days: 'Tue,Thu',    schedule_time: '09:00', capacity: 12, duration_minutes: 60, location: 'Studio C', category: 'wellness',color: '#06b6d4' },
    { id: 'cls_004', name: 'Spin Cycle',            description: 'High-energy indoor cycling class with motivating music and interval sprints.',          trainer_id: null,      schedule_days: 'Mon,Wed',    schedule_time: '18:30', capacity: 16, duration_minutes: 45, location: 'Cycle Room', category: 'cardio', color: '#7c3aed' },
    { id: 'cls_005', name: 'Boxing Fundamentals',  description: 'Learn boxing technique, footwork and combinations. All levels welcome.',                trainer_id: null,      schedule_days: 'Mon,Thu',    schedule_time: '19:30', capacity: 14, duration_minutes: 60, location: 'Box Ring', category: 'combat', color: '#10b981' },
  ];

  const insertClass = db.prepare(`INSERT INTO classes (id,name,description,trainer_id,schedule_days,schedule_time,capacity,duration_minutes,location,category,color) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  classes.forEach(c => insertClass.run(c.id, c.name, c.description, c.trainer_id, c.schedule_days, c.schedule_time, c.capacity, c.duration_minutes, c.location, c.category, c.color));

  // ─── MACHINES ──────────────────────────────────────────────────────────────
  const machines = [
    { id: 'mac_001', name: 'Treadmill 01',        type: 'Cardio',   zone: 'Cardio Floor',   status: 'operational', fault_code: null,    fault_description: null,                              last_maintenance: '2026-04-15', total_usage_hours: 1840, manufacturer: 'Life Fitness', model_number: 'T5-F3', installed_date: '2022-03-01', daily_sessions: 22 },
    { id: 'mac_002', name: 'Treadmill 02',        type: 'Cardio',   zone: 'Cardio Floor',   status: 'fault',       fault_code: 'E-05',  fault_description: 'Belt tension sensor failure – belt slip detected at high speed. Do not use.',   last_maintenance: '2026-02-20', total_usage_hours: 2103, manufacturer: 'Life Fitness', model_number: 'T5-F3', installed_date: '2022-03-01', daily_sessions: 0  },
    { id: 'mac_003', name: 'Treadmill 03',        type: 'Cardio',   zone: 'Cardio Floor',   status: 'operational', fault_code: null,    fault_description: null,                              last_maintenance: '2026-05-01', total_usage_hours: 1620, manufacturer: 'Life Fitness', model_number: 'T5-F3', installed_date: '2022-06-01', daily_sessions: 19 },
    { id: 'mac_004', name: 'Bench Press Station A',type: 'Strength', zone: 'Free Weights',   status: 'operational', fault_code: null,    fault_description: null,                              last_maintenance: '2026-03-10', total_usage_hours: 980,  manufacturer: 'Technogym',    model_number: 'Artis-BP', installed_date: '2021-11-15', daily_sessions: 28 },
    { id: 'mac_005', name: 'Bench Press Station B',type: 'Strength', zone: 'Free Weights',   status: 'operational', fault_code: null,    fault_description: null,                              last_maintenance: '2026-03-10', total_usage_hours: 870,  manufacturer: 'Technogym',    model_number: 'Artis-BP', installed_date: '2021-11-15', daily_sessions: 24 },
    { id: 'mac_006', name: 'Cable Machine',        type: 'Strength', zone: 'Free Weights',   status: 'fault',       fault_code: 'M-12',  fault_description: 'Cable fraying detected on upper pulley. Safety lock engaged. Awaiting replacement parts.',  last_maintenance: '2026-01-08', total_usage_hours: 1450, manufacturer: 'Matrix',       model_number: 'G7-FS7', installed_date: '2020-08-01', daily_sessions: 0  },
    { id: 'mac_007', name: 'Rowing Machine 01',    type: 'Cardio',   zone: 'Cardio Floor',   status: 'maintenance', fault_code: null,    fault_description: 'Scheduled 6-month service — damper blade and monitor calibration.', last_maintenance: '2025-12-01', total_usage_hours: 2250, manufacturer: 'Concept2',     model_number: 'Model D', installed_date: '2020-01-15', daily_sessions: 0  },
    { id: 'mac_008', name: 'Leg Press',            type: 'Strength', zone: 'Resistance Zone', status: 'operational', fault_code: null,    fault_description: null,                              last_maintenance: '2026-04-20', total_usage_hours: 1100, manufacturer: 'Hammer Strength', model_number: 'MLP', installed_date: '2021-06-01', daily_sessions: 31 },
    { id: 'mac_009', name: 'Lat Pulldown',         type: 'Strength', zone: 'Resistance Zone', status: 'operational', fault_code: null,    fault_description: null,                              last_maintenance: '2026-04-20', total_usage_hours: 950,  manufacturer: 'Hammer Strength', model_number: 'MLO', installed_date: '2021-06-01', daily_sessions: 26 },
    { id: 'mac_010', name: 'Stationary Bike 01',   type: 'Cardio',   zone: 'Cardio Floor',   status: 'operational', fault_code: null,    fault_description: null,                              last_maintenance: '2026-05-10', total_usage_hours: 1380, manufacturer: 'Peloton',      model_number: 'Bike+', installed_date: '2022-09-01', daily_sessions: 18 },
    { id: 'mac_011', name: 'Stationary Bike 02',   type: 'Cardio',   zone: 'Cardio Floor',   status: 'operational', fault_code: null,    fault_description: null,                              last_maintenance: '2026-05-10', total_usage_hours: 1295, manufacturer: 'Peloton',      model_number: 'Bike+', installed_date: '2022-09-01', daily_sessions: 17 },
    { id: 'mac_012', name: 'Elliptical Trainer 01',type: 'Cardio',   zone: 'Cardio Floor',   status: 'operational', fault_code: null,    fault_description: null,                              last_maintenance: '2026-04-05', total_usage_hours: 1760, manufacturer: 'Precor',       model_number: 'EFX 885', installed_date: '2021-03-01', daily_sessions: 20 },
  ];

  const insertMachine = db.prepare(`INSERT INTO machines (id,name,type,zone,status,fault_code,fault_description,last_maintenance,total_usage_hours,manufacturer,model_number,installed_date,daily_sessions) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  machines.forEach(m => insertMachine.run(m.id, m.name, m.type, m.zone, m.status, m.fault_code, m.fault_description, m.last_maintenance, m.total_usage_hours, m.manufacturer, m.model_number, m.installed_date, m.daily_sessions));

  // ─── SERVICES ──────────────────────────────────────────────────────────────
  const services = [
    { id: 'svc_001', name: 'Swedish Massage',      description: 'Full-body relaxation massage using long, flowing strokes. Perfect for stress relief and recovery.', duration_minutes: 60, price: 65.00, category: 'massage', provider: 'Jasmine Patel',  color: '#06b6d4' },
    { id: 'svc_002', name: 'Deep Tissue Massage',  description: 'Targets deep muscle layers to relieve chronic tension, knots, and post-workout soreness.',          duration_minutes: 60, price: 75.00, category: 'massage', provider: 'Jasmine Patel',  color: '#7c3aed' },
    { id: 'svc_003', name: 'Sports Massage',       description: 'Targeted treatment designed for athletes to enhance performance and speed up recovery.',             duration_minutes: 45, price: 55.00, category: 'massage', provider: 'Marcus Webb',    color: '#f59e0b' },
    { id: 'svc_004', name: 'Physiotherapy Session',description: 'One-to-one assessment and treatment from our certified physiotherapist for injuries or rehab.',      duration_minutes: 45, price: 80.00, category: 'physio',  provider: 'Dr. Amara Osei', color: '#10b981' },
    { id: 'svc_005', name: 'Hydrotherapy',         description: 'Water-based therapy session in our heated pool to reduce inflammation and improve joint mobility.',  duration_minutes: 30, price: 45.00, category: 'wellness', provider: 'Dr. Amara Osei',color: '#ec4899' },
  ];

  const insertService = db.prepare(`INSERT INTO services (id,name,description,duration_minutes,price,currency,category,provider,color) VALUES (?,?,?,?,?,?,?,?,?)`);
  services.forEach(s => insertService.run(s.id, s.name, s.description, s.duration_minutes, s.price, 'GBP', s.category, s.provider, s.color));

  // ─── JIM'S ATTENDANCE ──────────────────────────────────────────────────────
  // Good period: 2026-03-09 to 2026-05-25 (Mon/Wed/Fri, 3–4x/week)
  // Drop-off:   2026-05-26 to 2026-06-09 (zero visits)
  const jimAttendanceDates = [
    '2026-03-09','2026-03-11','2026-03-13',
    '2026-03-16','2026-03-18','2026-03-20',
    '2026-03-23','2026-03-25','2026-03-27',
    '2026-03-30','2026-04-01','2026-04-03','2026-04-04',
    '2026-04-07','2026-04-09','2026-04-11',
    '2026-04-14','2026-04-16','2026-04-17','2026-04-18',
    '2026-04-22','2026-04-23','2026-04-25',
    '2026-04-28','2026-04-30','2026-05-02',
    '2026-05-05','2026-05-06','2026-05-07','2026-05-09',
    '2026-05-12','2026-05-14','2026-05-16',
    '2026-05-19','2026-05-21','2026-05-23','2026-05-25',
  ];
  const hours = [6,7,7,8,6,7,8,6,7];
  const insertAttendance = db.prepare(`INSERT INTO attendance (id,member_id,check_in,check_out,access_point) VALUES (?,?,?,?,?)`);
  jimAttendanceDates.forEach((d, i) => {
    const h = hours[i % hours.length];
    const checkIn  = dt(d, h, Math.floor(Math.random() * 30));
    const checkOut = dt(d, h + 1, 15 + Math.floor(Math.random() * 30));
    insertAttendance.run(uuid(), 'mem_001', checkIn, checkOut, 'main_entrance');
  });

  // ─── SUSAN'S ATTENDANCE ────────────────────────────────────────────────────
  const susanDates = [
    '2026-03-12','2026-03-19','2026-03-26',
    '2026-04-02','2026-04-10','2026-04-23',
    '2026-05-07','2026-05-21','2026-05-28',
    '2026-06-04',
  ];
  susanDates.forEach((d,i) => {
    insertAttendance.run(uuid(), 'mem_002', dt(d, 10, 0), dt(d, 11, 30), 'main_entrance');
  });

  // ─── LISA AHMED ATTENDANCE (Akalla's declining student) ───────────────────
  // Good: Feb-April, drop-off: May (only 1 visit)
  const lisaDates = [
    '2026-02-10','2026-02-12','2026-02-17','2026-02-19',
    '2026-02-24','2026-02-26','2026-03-03','2026-03-05',
    '2026-03-10','2026-03-12','2026-03-17','2026-03-19',
    '2026-03-24','2026-03-26','2026-04-02','2026-04-07',
    '2026-04-09','2026-04-14','2026-04-22','2026-04-28',
    '2026-05-19',
  ];
  lisaDates.forEach(d => insertAttendance.run(uuid(), 'mem_005', dt(d, 7, 10), dt(d, 8, 0), 'main_entrance'));

  // ─── CARLOS REYES ATTENDANCE (another declining student) ──────────────────
  const carlosDates = [
    '2026-02-16','2026-02-18','2026-02-23','2026-02-25',
    '2026-03-02','2026-03-04','2026-03-09','2026-03-11',
    '2026-03-18','2026-03-25','2026-04-01','2026-04-08',
    '2026-04-15','2026-04-22','2026-04-29',
    '2026-05-06',
  ];
  carlosDates.forEach(d => insertAttendance.run(uuid(), 'mem_006', dt(d, 18, 5), dt(d, 19, 5), 'main_entrance'));

  // ─── ACTIVE MEMBERS ATTENDANCE ────────────────────────────────────────────
  const sarahDates = ['2026-05-12','2026-05-14','2026-05-19','2026-05-21','2026-05-26','2026-05-28','2026-06-02','2026-06-04','2026-06-09'];
  const jamesDates = ['2026-05-13','2026-05-15','2026-05-20','2026-05-22','2026-05-27','2026-06-03','2026-06-05','2026-06-09'];
  sarahDates.forEach(d => insertAttendance.run(uuid(), 'mem_010', dt(d, 9, 0),  dt(d, 10, 15), 'main_entrance'));
  jamesDates.forEach(d => insertAttendance.run(uuid(), 'mem_011', dt(d, 17, 30),dt(d, 19, 0),  'main_entrance'));

  // ─── CLASS BOOKINGS ────────────────────────────────────────────────────────
  const insertBooking = db.prepare(`INSERT INTO class_bookings (id,class_id,member_id,booking_date,status,booked_at) VALUES (?,?,?,?,?,?)`);

  // Jim: HIIT Blast (cls_001) Mon/Wed/Fri during good period
  const jimHiitDates = [
    '2026-03-09','2026-03-11','2026-03-13','2026-03-16','2026-03-18','2026-03-20',
    '2026-03-23','2026-03-25','2026-03-27','2026-03-30','2026-04-01','2026-04-03',
    '2026-04-07','2026-04-09','2026-04-11','2026-04-14','2026-04-16','2026-04-18',
    '2026-04-22','2026-04-25','2026-04-28','2026-04-30','2026-05-02',
    '2026-05-05','2026-05-07','2026-05-09','2026-05-12','2026-05-14','2026-05-16',
    '2026-05-19','2026-05-21','2026-05-23',
  ];
  jimHiitDates.forEach(d => insertBooking.run(uuid(), 'cls_001', 'mem_001', d, 'attended', dt(d, 6, 30)));

  // Jim: Functional Fitness (cls_002) some Tue/Thu
  const jimFuncDates = ['2026-03-17','2026-03-24','2026-04-01','2026-04-08','2026-04-22','2026-05-06','2026-05-20'];
  jimFuncDates.forEach(d => insertBooking.run(uuid(), 'cls_002', 'mem_001', d, 'attended', dt(d, 17, 30)));

  // Upcoming bookings for Jim (future)
  insertBooking.run(uuid(), 'cls_001', 'mem_001', '2026-06-11', 'booked', dt('2026-06-09', 8, 0));
  insertBooking.run(uuid(), 'cls_001', 'mem_001', '2026-06-13', 'booked', dt('2026-06-09', 8, 0));
  insertBooking.run(uuid(), 'cls_002', 'mem_001', '2026-06-11', 'booked', dt('2026-06-09', 8, 0));

  // Susan: Yoga Flow (cls_003)
  const susanYogaDates = ['2026-04-10','2026-04-24','2026-05-08','2026-05-22'];
  susanYogaDates.forEach(d => insertBooking.run(uuid(), 'cls_003', 'mem_002', d, 'attended', dt(d, 8, 30)));
  insertBooking.run(uuid(), 'cls_003', 'mem_002', '2026-06-12', 'booked', dt('2026-06-09', 10, 0));

  // Lisa: HIIT Blast bookings (declining)
  const lisaHiitDates = [
    '2026-02-10','2026-02-12','2026-02-17','2026-02-19','2026-02-24',
    '2026-03-03','2026-03-10','2026-03-17','2026-03-24','2026-04-07',
    '2026-04-14','2026-04-22','2026-05-19',
  ];
  lisaHiitDates.forEach((d,i) => {
    const status = i < 12 ? 'attended' : 'attended';
    insertBooking.run(uuid(), 'cls_001', 'mem_005', d, status, dt(d, 6, 45));
  });

  // Carlos: Functional Fitness bookings (declining)
  const carlosFuncDates = [
    '2026-02-18','2026-02-25','2026-03-04','2026-03-11',
    '2026-03-18','2026-03-25','2026-04-08','2026-04-15',
    '2026-04-22','2026-04-29','2026-05-06',
  ];
  carlosFuncDates.forEach(d => insertBooking.run(uuid(), 'cls_002', 'mem_006', d, 'attended', dt(d, 17, 45)));

  // Sarah: Spin Cycle
  ['2026-05-12','2026-05-19','2026-05-26','2026-06-02','2026-06-09'].forEach(d =>
    insertBooking.run(uuid(), 'cls_004', 'mem_010', d, d < '2026-06-09' ? 'attended' : 'booked', dt(d, 18, 0)));

  // James: HIIT Blast
  ['2026-05-13','2026-05-20','2026-05-27','2026-06-03'].forEach(d =>
    insertBooking.run(uuid(), 'cls_001', 'mem_011', d, 'attended', dt(d, 6, 55)));

  // ─── JIM'S VITALS ──────────────────────────────────────────────────────────
  const insertVital = db.prepare(`INSERT INTO vitals (id,member_id,recorded_at,heart_rate_avg,heart_rate_max,calories_burned,cardio_duration_minutes,steps,vo2_max,spo2) VALUES (?,?,?,?,?,?,?,?,?,?)`);

  const jimVitals = [
    { date: '2026-03-13', hr_avg: 142, hr_max: 168, cal: 380, cardio: 32, steps: 7800, vo2: 42.8, spo2: 97 },
    { date: '2026-03-20', hr_avg: 145, hr_max: 172, cal: 410, cardio: 35, steps: 8200, vo2: 43.1, spo2: 97 },
    { date: '2026-03-27', hr_avg: 139, hr_max: 165, cal: 360, cardio: 30, steps: 7400, vo2: 43.5, spo2: 98 },
    { date: '2026-04-03', hr_avg: 148, hr_max: 174, cal: 430, cardio: 38, steps: 8600, vo2: 44.2, spo2: 96 },
    { date: '2026-04-11', hr_avg: 151, hr_max: 178, cal: 455, cardio: 40, steps: 9100, vo2: 44.8, spo2: 97 },
    { date: '2026-04-18', hr_avg: 147, hr_max: 171, cal: 420, cardio: 36, steps: 8400, vo2: 45.2, spo2: 97 },
    { date: '2026-04-25', hr_avg: 153, hr_max: 180, cal: 468, cardio: 42, steps: 9400, vo2: 45.6, spo2: 96 },
    { date: '2026-05-02', hr_avg: 149, hr_max: 176, cal: 440, cardio: 39, steps: 8800, vo2: 46.1, spo2: 97 },
    { date: '2026-05-09', hr_avg: 155, hr_max: 182, cal: 475, cardio: 43, steps: 9600, vo2: 46.7, spo2: 96 },
    { date: '2026-05-16', hr_avg: 152, hr_max: 179, cal: 460, cardio: 41, steps: 9200, vo2: 47.1, spo2: 97 },
    { date: '2026-05-23', hr_avg: 150, hr_max: 177, cal: 448, cardio: 40, steps: 9000, vo2: 47.5, spo2: 98 },
  ];
  jimVitals.forEach(v => insertVital.run(uuid(), 'mem_001', dt(v.date, 8), v.hr_avg, v.hr_max, v.cal, v.cardio, v.steps, v.vo2, v.spo2));

  // ─── JIM'S PERSONAL RECORDS ────────────────────────────────────────────────
  const insertPR = db.prepare(`INSERT INTO personal_records (id,member_id,exercise,weight_kg,reps,recorded_at,notes,distance_km,duration_seconds,machine_type) VALUES (?,?,?,?,?,?,?,?,?,?)`);

  const jimPRs = [
    // Bench Press progression (analog)
    { exercise: 'Bench Press', weight: 80.0, reps: 5, date: '2026-03-14', notes: 'Solid form, felt strong',          dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Bench Press', weight: 82.5, reps: 5, date: '2026-04-04', notes: 'New PR – consistency paying off',  dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Bench Press', weight: 85.0, reps: 5, date: '2026-04-18', notes: 'Clean reps, no spotter needed',    dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Bench Press', weight: 87.5, reps: 4, date: '2026-05-02', notes: '4 clean reps at 87.5 – close!',   dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Bench Press', weight: 90.0, reps: 3, date: '2026-05-23', notes: '🏆 New all-time PR – 90kg!',      dist: null, secs: null, mtype: 'analog' },
    // Back Squat progression (analog)
    { exercise: 'Back Squat',  weight: 100.0, reps: 5, date: '2026-03-20', notes: 'Good depth',                     dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Back Squat',  weight: 105.0, reps: 5, date: '2026-04-10', notes: 'Form check passed',              dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Back Squat',  weight: 110.0, reps: 5, date: '2026-04-24', notes: 'Belt used, great session',       dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Back Squat',  weight: 115.0, reps: 4, date: '2026-05-08', notes: 'PR depth and weight',            dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Back Squat',  weight: 120.0, reps: 3, date: '2026-05-22', notes: '🏆 120kg milestone!',            dist: null, secs: null, mtype: 'analog' },
    // Deadlift progression (analog)
    { exercise: 'Deadlift',    weight: 120.0, reps: 5, date: '2026-03-27', notes: 'Mixed grip, clean pull',         dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Deadlift',    weight: 125.0, reps: 5, date: '2026-04-17', notes: 'Double overhand, solid',         dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Deadlift',    weight: 130.0, reps: 4, date: '2026-04-30', notes: 'New PR territory',               dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Deadlift',    weight: 135.0, reps: 3, date: '2026-05-14', notes: 'Felt explosive',                 dist: null, secs: null, mtype: 'analog' },
    { exercise: 'Deadlift',    weight: 140.0, reps: 2, date: '2026-05-23', notes: '🏆 140kg – best ever!',          dist: null, secs: null, mtype: 'analog' },
    // Treadmill 5km runs (digital) – improving times
    { exercise: 'Treadmill 5km', weight: null, reps: null, date: '2026-03-15', notes: 'First timed 5km',            dist: 5.0, secs: 1740, mtype: 'digital' }, // 29:00
    { exercise: 'Treadmill 5km', weight: null, reps: null, date: '2026-04-05', notes: 'Shaved a minute off!',       dist: 5.0, secs: 1680, mtype: 'digital' }, // 28:00
    { exercise: 'Treadmill 5km', weight: null, reps: null, date: '2026-04-19', notes: 'Consistent pace throughout', dist: 5.0, secs: 1650, mtype: 'digital' }, // 27:30
    { exercise: 'Treadmill 5km', weight: null, reps: null, date: '2026-05-03', notes: 'Near-perfect pacing',        dist: 5.0, secs: 1590, mtype: 'digital' }, // 26:30
    { exercise: 'Treadmill 5km', weight: null, reps: null, date: '2026-05-17', notes: '🏆 New PB – sub 26 min!',   dist: 5.0, secs: 1548, mtype: 'digital' }, // 25:48
    // Stationary Bike 10km (digital)
    { exercise: 'Stationary Bike 10km', weight: null, reps: null, date: '2026-04-10', notes: 'First timed 10km',   dist: 10.0, secs: 1260, mtype: 'digital' }, // 21:00
    { exercise: 'Stationary Bike 10km', weight: null, reps: null, date: '2026-05-08', notes: '🏆 New PB – 20:15!', dist: 10.0, secs: 1215, mtype: 'digital' }, // 20:15
  ];
  jimPRs.forEach(r => insertPR.run(uuid(), 'mem_001', r.exercise, r.weight, r.reps, dt(r.date, 8), r.notes, r.dist, r.secs, r.mtype));

  // ─── PAYMENTS ──────────────────────────────────────────────────────────────
  const insertPayment = db.prepare(`INSERT INTO payments (id,member_id,amount,currency,due_date,paid_date,status,failure_code,failure_reason,attempts,mandate_ref) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);

  // Jim – all paid (last 6 months)
  ['2026-01-01','2026-02-01','2026-03-01','2026-04-01','2026-05-01','2026-06-01'].forEach(d =>
    insertPayment.run(uuid(), 'mem_001', 59.99, 'GBP', d, d, 'paid', null, null, 1, 'BACS-GMS-001'));

  // Susan – all paid
  ['2026-03-20','2026-04-20','2026-05-20','2026-06-01'].forEach(d =>
    insertPayment.run(uuid(), 'mem_002', 39.99, 'GBP', d, d, 'paid', null, null, 1, 'BACS-GMS-002'));

  // Mark Thompson – 2 failed attempts (BACS ADDACS – account changed)
  insertPayment.run(uuid(), 'mem_007', 39.99, 'GBP', '2026-04-01', '2026-04-01', 'paid',    null,       null,                       1, 'BACS-GMS-007');
  insertPayment.run(uuid(), 'mem_007', 39.99, 'GBP', '2026-05-01', null,         'failed',  'ADDACS',   'Bank account details changed – mandate cancelled by payer bank', 1, 'BACS-GMS-007');
  insertPayment.run(uuid(), 'mem_007', 39.99, 'GBP', '2026-06-01', null,         'failed',  'ADDACS',   'Retry failed – payer bank rejecting mandate reference',           2, 'BACS-GMS-007');

  // Emma Wilson – 1 failed (insufficient funds ARUCS)
  insertPayment.run(uuid(), 'mem_008', 59.99, 'GBP', '2026-04-01', '2026-04-01', 'paid',   null,       null,                           1, 'BACS-GMS-008');
  insertPayment.run(uuid(), 'mem_008', 59.99, 'GBP', '2026-05-01', '2026-05-03', 'paid',   null,       null,                           1, 'BACS-GMS-008');
  insertPayment.run(uuid(), 'mem_008', 59.99, 'GBP', '2026-06-01', null,         'failed', 'ARUCS',    'Insufficient funds – payment returned unpaid',                    1, 'BACS-GMS-008');

  // Tom Richards – 3 failed (access locked)
  insertPayment.run(uuid(), 'mem_009', 39.99, 'GBP', '2026-03-01', null, 'failed', 'MS03',     'Insufficient funds – first failure',    1, 'BACS-GMS-009');
  insertPayment.run(uuid(), 'mem_009', 39.99, 'GBP', '2026-04-01', null, 'failed', 'MS03',     'Insufficient funds – second failure',   2, 'BACS-GMS-009');
  insertPayment.run(uuid(), 'mem_009', 39.99, 'GBP', '2026-05-01', null, 'failed', 'ADDACS',   'Account closed – cannot be collected',  3, 'BACS-GMS-009');

  // Active members payments
  ['mem_005','mem_006','mem_010','mem_011'].forEach(mid => {
    ['2026-03-01','2026-04-01','2026-05-01','2026-06-01'].forEach(d =>
      insertPayment.run(uuid(), mid, 39.99, 'GBP', d, d, 'paid', null, null, 1, `BACS-GMS-${mid.split('_')[1]}`));
  });

  // ─── SERVICE BOOKINGS ──────────────────────────────────────────────────────
  const insertSvcBooking = db.prepare(`INSERT INTO service_bookings (id,service_id,member_id,booking_datetime,status,notes,created_at) VALUES (?,?,?,?,?,?,?)`);

  // Susan's past bookings
  insertSvcBooking.run(uuid(), 'svc_001', 'mem_002', '2026-04-15T11:00:00.000Z', 'completed', 'Regular relaxation session', dt('2026-04-10', 10));
  insertSvcBooking.run(uuid(), 'svc_003', 'mem_002', '2026-05-20T14:00:00.000Z', 'completed', 'Post-yoga recovery', dt('2026-05-15', 9));
  insertSvcBooking.run(uuid(), 'svc_002', 'mem_002', '2026-06-05T10:00:00.000Z', 'completed', 'Pre-holiday deep tissue', dt('2026-06-01', 11));
  // Susan's upcoming booking
  insertSvcBooking.run(uuid(), 'svc_001', 'mem_002', '2026-06-16T11:00:00.000Z', 'confirmed', 'Monthly relaxation', dt('2026-06-09', 10, 15));

  // James also has a physio session
  insertSvcBooking.run(uuid(), 'svc_004', 'mem_011', '2026-06-12T15:00:00.000Z', 'confirmed', 'Shoulder assessment', dt('2026-06-08', 14));

  console.log('  ✅ Members, classes, machines, payments, vitals, and records seeded');
}

module.exports = { seedDatabase };
