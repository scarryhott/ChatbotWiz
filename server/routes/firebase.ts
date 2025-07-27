import { Router } from 'express';

const router = Router();

// Firebase topic completion endpoint
router.post('/topics', async (req, res) => {
  try {
    const { userId, topicId, completed, timestamp } = req.body;
    
    // Here you would normally save to Firebase
    // For now, we'll just log it
    console.log(`Firebase Topic Update: User ${userId} completed topic ${topicId} at ${timestamp}`);
    
    res.json({ 
      success: true, 
      message: `Topic ${topicId} marked as completed for user ${userId}` 
    });
  } catch (error) {
    console.error('Error updating Firebase topic:', error);
    res.status(500).json({ error: 'Failed to update topic completion' });
  }
});

export default router;