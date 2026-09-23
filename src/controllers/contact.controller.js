const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const contactService = require('../services/contact.service');

const getContacts = asyncHandler(async (req, res) => {
  const contacts = await contactService.getContactList(req.user.phoneNumber);
  res.json({ success: true, contacts });
});

const addContact = asyncHandler(async (req, res) => {
  const { contactNumber } = req.body;
  if (!contactNumber) {
    throw new ApiError(400, 'contactNumber is required');
  }

  await contactService.addContact(req.user.phoneNumber, contactNumber);
  const contacts = await contactService.getContactList(req.user.phoneNumber);

  res.status(201).json({ success: true, message: 'Contact added successfully', contacts });
});

const updateContactProfile = asyncHandler(async (req, res) => {
  const { contactNumber } = req.params;
  const { nickname, avatarColor } = req.body;

  await contactService.updateContactProfile(req.user.phoneNumber, contactNumber, {
    nickname,
    avatarColor,
  });
  const contacts = await contactService.getContactList(req.user.phoneNumber);

  res.json({ success: true, contacts });
});

module.exports = { getContacts, addContact, updateContactProfile };
