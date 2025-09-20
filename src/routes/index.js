const { Router } = require('express');

const router = Router();

router.use('/auth', require('./v1/auth'));
router.use('/customers', require('./v1/customers'));
router.use('/inventory', require('./v1/inventory'));
router.use('/orders', require('./v1/orders'));
router.use('/designs', require('./v1/designs'));
router.use('/reports', require('./v1/reports'));
router.use('/masters', require('./v1/masters'));
router.use('/suppliers', require('./v1/suppliers'));
router.use('/inventory-entries', require('./v1/inventoryEntries'));
router.use('/upload', require('./v1/upload'));

module.exports = router;
