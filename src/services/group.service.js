const Group = require('../models/group.model');
const GroupList = require('../models/groupList.model');
const ApiError = require('../utils/ApiError');

const createGroup = async ({ name, members, createdBy }) => {
  const uniqueMembers = Array.from(new Set([...members, createdBy]));
  if (uniqueMembers.length < 3) {
    throw new ApiError(400, 'A group needs at least 2 other members');
  }

  const group = await Group.create({ name, members: uniqueMembers, createdBy });
  const groupId = group._id.toString();

  // Same two-step upsert-then-push pattern as contact.service.js's addSide —
  // give every member (including the creator) a preview entry.
  await Promise.all(
    uniqueMembers.map(async (ownerNumber) => {
      await GroupList.findOneAndUpdate(
        { ownerNumber },
        { $setOnInsert: { ownerNumber, groups: [] } },
        { upsert: true }
      );
      await GroupList.updateOne(
        { ownerNumber },
        {
          $push: {
            groups: {
              groupId,
              name: group.name,
              lastMessage: '',
              lastMessageTime: group.createdAt,
              unreadMessageCount: 0,
            },
          },
        }
      );
    })
  );

  return group;
};

const getGroup = async (groupId) => Group.findById(groupId).lean();

const getGroupList = async (ownerNumber) => {
  const groupList = await GroupList.findOne({ ownerNumber }).lean();
  if (!groupList) return [];
  return [...groupList.groups].sort(
    (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  );
};

const updateGroupPreview = async ({ ownerNumber, groupId, lastMessage, lastMessageTime, incrementUnread }) => {
  const update = {
    $set: {
      'groups.$.lastMessage': lastMessage,
      'groups.$.lastMessageTime': lastMessageTime,
    },
  };
  if (incrementUnread) {
    update.$inc = { 'groups.$.unreadMessageCount': 1 };
  }

  await GroupList.updateOne({ ownerNumber, 'groups.groupId': groupId }, update);
};

const markGroupRead = async (ownerNumber, groupId) => {
  await GroupList.updateOne(
    { ownerNumber, 'groups.groupId': groupId },
    { $set: { 'groups.$.unreadMessageCount': 0 } }
  );
};

module.exports = { createGroup, getGroup, getGroupList, updateGroupPreview, markGroupRead };
