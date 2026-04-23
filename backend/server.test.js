const request = require('supertest');
const app = require('./server');

describe('GET /health', () => {
  it('retourne le status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('weight-tracker-api');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('GET /api/weights', () => {
  it('retourne un tableau', async () => {
    const res = await request(app).get('/api/weights');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/weights', () => {
  it('ajoute un nouveau poids', async () => {
    const res = await request(app)
      .post('/api/weights')
      .send({ weight: 80.0, date: '2026-04-20' });
    expect(res.statusCode).toBe(201);
    expect(res.body.weight).toBe(80.0);
    expect(res.body.date).toBe('2026-04-20');
    expect(res.body).toHaveProperty('id');
  });

  it('refuse si le poids est manquant', async () => {
    const res = await request(app)
      .post('/api/weights')
      .send({ date: '2026-04-20' });
    expect(res.statusCode).toBe(400);
  });

  it('refuse si la date est manquante', async () => {
    const res = await request(app)
      .post('/api/weights')
      .send({ weight: 80.0 });
    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/weights/:id', () => {
  it('modifie un enregistrement existant', async () => {
    const create = await request(app)
      .post('/api/weights')
      .send({ weight: 75.0, date: '2026-04-10' });
    const id = create.body.id;

    const res = await request(app)
      .put('/api/weights/' + id)
      .send({ weight: 76.5 });
    expect(res.statusCode).toBe(200);
    expect(res.body.weight).toBe(76.5);
  });

  it('retourne 404 si id inexistant', async () => {
    const res = await request(app)
      .put('/api/weights/9999')
      .send({ weight: 80.0 });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/weights/:id', () => {
  it('supprime un enregistrement existant', async () => {
    const create = await request(app)
      .post('/api/weights')
      .send({ weight: 90.0, date: '2026-04-05' });
    const id = create.body.id;

    const res = await request(app).delete('/api/weights/' + id);
    expect(res.statusCode).toBe(200);
  });

  it('retourne 404 si id inexistant', async () => {
    const res = await request(app).delete('/api/weights/9999');
    expect(res.statusCode).toBe(404);
  });
});
