import mongoose from 'mongoose';
import Group from '../models/Group.js';
import GroupJoinRequest from '../models/GroupJoinRequest.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import {createNoti} from "../services/notiService.js";


export const createGroup = async (req, res) => {
  try {
    console.log("Request body:", req.body);  // 요청 바디 확인

    if (!req.session.user) {
      return res.status(401).json({ message: 'User is not logged in' });
    }

    const { groupName, description, avatar, visibility, createdBy } = req.body;
    
    console.log("Created by ID:", createdBy);  // createdBy가 제대로 전달되었는지 확인

    const existingGroup = await Group.findOne({ groupName });
    if (existingGroup) {
      return res.status(400).json({ message: 'A group with this name already exists. Please choose a different name.' });
    }

    // 유저 오브젝트 아이디를 createdBy로 사용
    const user = await User.findById(createdBy);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newGroup = new Group({
      groupName,
      description,
      avatar,
      status: 'pending',
      createdBy: user._id,  // 오브젝트 아이디로 저장
      visibility,
      members: [user._id],  // 유저 오브젝트 아이디를 members 배열에 추가
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create group', error: err.message });
  }
};


export const getListGroup = async (req, res) => {
  try {
    let { page, limit, status, search, searchType, role, createdBy } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (role) {
      filter.role = role;
    }
    if (createdBy) {
      filter.createdBy = createdBy;  // createdBy 필터 추가
    }
    if (search) {
      if (searchType === "groupName") {
        filter.groupName = { $regex: search, $options: "i" };
      } else if (searchType === "createdBy") {
        filter.createdBy = { $regex: search, $options: "i" };
      } else {
        filter.$or = [
          { groupName: { $regex: search, $options: "i" } },
          { createdBy: { $regex: search, $options: "i" } },
        ];
      }
    }

    const totalCount = await Group.countDocuments();
    const totalPages = (await Group.countDocuments(filter)) / limit;
    const groups = await Group.find(filter)
      .limit(limit)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      totalPages: Math.ceil(totalPages),
      totalCount: totalCount,
      message: "Successfully fetched groups",
      data: groups,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again.",
    });
  }
};



// Approve group request
export const approveGroupRequest = async (req, res) => {
  console.log("🚀 ~ approveGroupRequest ~ req:", req.params)
  const id = req.params.groupId;
  try {
    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      {
        $set: { status: "active" },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Successfully approve group request",
      data: updatedGroup,
    });

    const userEmail = Group.findOne({id: id}, 'createdBy')
    console.log (userEmail)
    const user = await User.findOne({ email: userEmail }); // TODO: not functional for now.
    console.log(user)
    createNoti(
        'Your Group Creation Request has been approved',
        [user._id],
        'unread',
        '/'
    )

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to approve group request. Try again",
    });
  }
};

// Reject group request
export const rejectGroupRequest = async (req, res) => {
  const id = req.params.groupId;
  try {
    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      {
        $set: { status: "inactive" },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Successfully reject group request",
      data: updatedGroup,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to reject group request. Try again",
    });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch groups', error: err.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGroup = await Group.findByIdAndDelete(id);
    if (!deletedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete group', error: err.message });
  }
};

export const joinGroup = async (req, res) => {
  const { groupName } = req.body;

  if (!req.session.user) {
    return res.status(401).json({ message: 'User is not logged in' });
  }

  const userEmail = req.session.user.email;

  try {
    // 이미 조인 요청이 있는지 확인
    const existingRequest = await GroupJoinRequest.findOne({ userEmail, groupName });
    if (existingRequest) {
      return res.status(400).json({ message: 'You have already requested to join this group.' });
    }

    const newRequest = new GroupJoinRequest({
      userEmail: userEmail,
      groupName: groupName,
      requestedAt: new Date(),
      status: 'pending',
    });

    const savedRequest = await newRequest.save();
    res.status(201).json({ message: 'Group join request submitted successfully', request: savedRequest });

    // notifying the group owner on new group join rq TODO: unfinished
    const groupOwner = Group.findOne({createdBy: userEmail})
    createNoti(
        'You received a New Group Join Request',
        [groupOwner.createdBy],
        'unread',
        '/'
    )

  } catch (error) {
    console.error('Error creating group join request:', error);
    res.status(500).json({ message: 'Failed to create group join request', error: error.message });
  }
};

export const getRequestedGroups = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const requests = await GroupJoinRequest.find({ userEmail: email });
    const groupNames = requests.map(req => req.groupName);
    res.status(200).json(groupNames);
  } catch (error) {
    console.error('Error fetching requested groups:', error);
    res.status(500).json({ message: 'Failed to fetch requested groups', error: error.message });
  }
};

export const getJoinRequests = async (req, res) => {
  const { groupName } = req.query;

  try {
    const requests = await GroupJoinRequest.find({ groupName, status: 'pending' });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ message: 'Failed to fetch join requests', error: error.message });
  }
};

export const acceptMember = async (req, res) => {
  const { groupName, userEmail } = req.body;

  try {
    // 해당 그룹을 찾기
    const group = await Group.findOne({ groupName });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // 유저의 오브젝트 아이디를 이메일을 통해 찾기
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 중복되지 않게 유저 오브젝트 아이디 추가
    if (!group.members.includes(user._id)) {
      group.members.push(user._id);
      await group.save();
    } else {
      return res.status(400).json({ message: 'User is already a member of the group' });
    }

    // 해당 조인 요청 삭제
    const request = await GroupJoinRequest.findOneAndDelete({ groupName, userEmail, status: 'pending' });
    if (!request) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    createNoti(
        'You have successfully joined a group',
        [],
        'unread',
        '/'
    )

    res.status(200).json({ message: 'Member accepted and added to group' });
  } catch (error) {
    console.error('Error accepting member:', error);
    res.status(500).json({ message: 'Failed to accept member', error: error.message });
  }
};


export const rejectMember = async (req, res) => {
  const { requestId } = req.params;

  try {
    // 해당 조인 요청 삭제
    const result = await GroupJoinRequest.findByIdAndDelete(requestId);
    if (!result) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json({ message: 'Join request rejected and deleted' });
  } catch (error) {
    console.error('Error rejecting member:', error);
    res.status(500).json({ message: 'Failed to reject member', error: error.message });
  }
};

export const getGroupsForMember = async (req, res) => {
  const { memberId } = req.query;

  try {
    const groups = await Group.find({ members: memberId });
    res.status(200).json(groups);
  } catch (error) {
    console.error('Error fetching groups for member:', error);
    res.status(500).json({ message: 'Failed to fetch groups for member', error: error.message });
  }
};

export const removeMemberFromGroup = async (req, res) => {
  const { groupId, userId } = req.body;

  // ObjectId 유효성 확인
  if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid groupId or userId' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Remove the member's ObjectId from the group's members array
    group.members = group.members.filter(member => member.toString() !== userId);
    await group.save();

    res.status(200).json({ message: 'Member removed from group successfully' });
  } catch (error) {
    console.error('Error removing member from group:', error);
    res.status(500).json({ message: 'Failed to remove member from group', error: error.message });
  }
};



export const getGroupById = async (req, res) => {
  const { id } = req.params;

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Failed to fetch group', error: error.message });
  }
};

export const getGroupsForUser = async (req, res) => {
  const { memberId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ message: 'Invalid memberId format' });
  }

  try {
    // memberId를 가지고 멤버가 속한 모든 그룹을 찾습니다.
    const groups = await Group.find({ members: new mongoose.Types.ObjectId(memberId) });
    res.status(200).json(groups); // 그룹 자체를 반환합니다.
  } catch (error) {
    console.error('Error fetching groups for member:', error);
    res.status(500).json({ message: 'Failed to fetch groups for member', error: error.message });
  }
};

// 특정 그룹의 멤버들을 가져오는 API
export const getMembersOfGroup = async (req, res) => {
  const { groupName } = req.params;

  try {
    const group = await Group.findOne({ groupName });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const members = await User.find({ _id: { $in: group.members } });
    res.status(200).json(members);
  } catch (error) {
    console.error('Error fetching members of group:', error);
    res.status(500).json({ message: 'Failed to fetch members of group', error: error.message });
  }
};


export const getGroupByName = async (req, res) => {
  const { groupName } = req.params;

  try {
    const group = await Group.findOne({ groupName }); // Find the group by name
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Return only the ObjectId of the group
    res.status(200).json({ _id: group._id });
  } catch (error) {
    console.error('Error fetching group by name:', error);
    res.status(500).json({ message: 'Failed to fetch group', error: error.message });
  }
};


// group post
// 특정 그룹의 모든 포스트 가져오기
export const getGroupPosts = async (req, res) => {
    try {
        const { groupId } = req.params;
        
        // 그룹 ID로 포스트 검색
        const posts = await Post.find({ groupId })
            .sort({ date: -1 })
            .populate('author', 'firstName lastName avatar')
            .populate('userProfile', 'avatar');
        
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching group posts:', error);
        res.status(500).json({ message: "Error fetching group posts", error });
    }
};

// 특정 그룹에 포스트 추가하기
export const createGroupPost = async (req, res) => {
  try {
      const { groupId } = req.params;
      const { content, images } = req.body;

      // 세션에 저장된 유저 정보 확인
      if (!req.session.user) {
          return res.status(401).json({ message: 'User is not logged in' });
      }

      const newPost = new Post({
          content,
          userProfile: req.session.user.id,
          userId: req.session.user.id,
          author: req.session.user.id,
          images,
          date: new Date(),
          groupId,  // 그룹 ID 추가
          isGroupPost: true,  // 그룹 게시물로 설정
      });

      await newPost.save();
      res.status(201).json(newPost);
  } catch (error) {
      console.error('Error creating group post:', error);
      res.status(500).json({ message: "Error creating group post", error });
  }
};
