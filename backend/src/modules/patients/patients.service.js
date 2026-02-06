const { listPatientsRepository } = require('./patients.repository');

async function listPatientsService(input) {
  return listPatientsRepository(input);
}

module.exports = {
  listPatientsService
};
