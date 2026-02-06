// src/routes/googleReviewsRoutes.js
const express = require('express');
const axios = require('axios');

const router = express.Router();

/**
 * GET /api/google-reviews
 * Fetch Google reviews for a place
 * Query params: placeId
 */
router.get('/', async (req, res) => {
  try {
    const { placeId } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!placeId) {
      return res.status(400).json({ error: 'placeId is required' });
    }

    if (!apiKey) {
      return res.status(503).json({
        error: 'Google Places API not configured',
        message: 'Set GOOGLE_PLACES_API_KEY in environment variables'
      });
    }

    // Fetch place details from Google Places API
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          fields: 'name,rating,reviews,user_ratings_total',
          key: apiKey
        }
      }
    );

    if (response.data.status !== 'OK') {
      return res.status(400).json({
        error: 'Failed to fetch reviews',
        status: response.data.status,
        message: response.data.error_message
      });
    }

    const { result } = response.data;

    res.json({
      name: result.name,
      rating: result.rating,
      total_reviews: result.user_ratings_total,
      reviews: result.reviews || []
    });
  } catch (error) {
    console.error('Google Reviews API error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch Google reviews',
      details: error.message
    });
  }
});

module.exports = router;
