const { listAppointmentsRepository } = require('./appointments.repository');

async function listAppointmentsService(input) {
  return listAppointmentsRepository(input);
}

module.exports = {
  listAppointmentsService
};
