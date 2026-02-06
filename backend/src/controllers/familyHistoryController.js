const { getDb } = require('../config/db');

async function getFamilyHistory(req, res) {
  try {
    const { patientId } = req.params;
    const db = getDb();

    const [history] = await db.execute(
      `SELECT id, patient_id, relation, condition_name, condition_name as condition, icd_code, notes, created_at
       FROM family_history WHERE patient_id = ? ORDER BY created_at DESC`,
      [patientId]
    );

    res.json({ history });
  } catch (error) {
    console.error('Get family history error:', error);
    res.status(500).json({ error: 'Failed to fetch family history' });
  }
}

async function addFamilyHistory(req, res) {
  try {
    const { patientId } = req.params;
    // Support both 'condition' and 'condition_name' from frontend
    const { relation, condition, condition_name, icd_code, notes } = req.body;
    const conditionValue = condition_name || condition;

    if (!relation || !conditionValue) {
      return res.status(400).json({ error: 'Relation and condition are required' });
    }

    // Convert relation to lowercase for ENUM compatibility
    const relationLower = relation.toLowerCase();

    // Validate relation value
    const validRelations = ['father', 'mother', 'brother', 'sister', 'grandparent', 'child', 'other'];
    const finalRelation = validRelations.includes(relationLower) ? relationLower : 'other';

    const db = getDb();
    const [result] = await db.execute(
      `INSERT INTO family_history (patient_id, relation, condition_name, icd_code, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId, finalRelation, conditionValue, icd_code || null, notes || null]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Family history added successfully'
    });
  } catch (error) {
    console.error('Add family history error:', error);
    res.status(500).json({ error: 'Failed to add family history', details: error.message });
  }
}

async function updateFamilyHistory(req, res) {
  try {
    const { id } = req.params;
    // Support both 'condition' and 'condition_name' from frontend
    const { relation, condition, condition_name, icd_code, notes } = req.body;
    const conditionValue = condition_name || condition;

    const db = getDb();
    const updateFields = [];
    const params = [];

    if (relation) {
      // Convert relation to lowercase for ENUM compatibility
      const validRelations = ['father', 'mother', 'brother', 'sister', 'grandparent', 'child', 'other'];
      const relationLower = relation.toLowerCase();
      const finalRelation = validRelations.includes(relationLower) ? relationLower : 'other';
      updateFields.push('relation = ?');
      params.push(finalRelation);
    }
    if (conditionValue) { updateFields.push('condition_name = ?'); params.push(conditionValue); }
    if (icd_code !== undefined) { updateFields.push('icd_code = ?'); params.push(icd_code); }
    if (notes !== undefined) { updateFields.push('notes = ?'); params.push(notes); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    await db.execute(
      `UPDATE family_history SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Family history updated successfully' });
  } catch (error) {
    console.error('Update family history error:', error);
    res.status(500).json({ error: 'Failed to update family history', details: error.message });
  }
}

async function deleteFamilyHistory(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    await db.execute('DELETE FROM family_history WHERE id = ?', [id]);

    res.json({ message: 'Family history deleted successfully' });
  } catch (error) {
    console.error('Delete family history error:', error);
    res.status(500).json({ error: 'Failed to delete family history' });
  }
}

module.exports = {
  getFamilyHistory,
  addFamilyHistory,
  updateFamilyHistory,
  deleteFamilyHistory
};

