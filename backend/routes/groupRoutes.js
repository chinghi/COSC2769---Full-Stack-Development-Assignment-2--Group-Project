import express from 'express';
import { createGroup } from '../controllers/groupController.js';
import { getGroups, deleteGroup, joinGroup } from '../controllers/groupController.js';

const router = express.Router();

router.post('/create', createGroup);

// 그룹 조회 라우트
router.get('/', getGroups);

// 그룹 삭제 라우트
router.delete('/:id', deleteGroup);
router.post('/join-group', joinGroup);

export default router;
