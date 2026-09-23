const contactService = require('./contact.service');
const groupService = require('./group.service');

// One sorted list combining 1:1 contacts and groups, tagged by `type` —
// this is what makes "newest first" hold across both kinds of chat together.
const getUnifiedChatList = async (phoneNumber) => {
  const [contacts, groups] = await Promise.all([
    contactService.getContactList(phoneNumber),
    groupService.getGroupList(phoneNumber),
  ]);

  const taggedContacts = contacts.map((c) => ({ ...c, type: 'contact' }));
  const taggedGroups = groups.map((g) => ({ ...g, type: 'group' }));

  return [...taggedContacts, ...taggedGroups].sort(
    (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  );
};

module.exports = { getUnifiedChatList };
