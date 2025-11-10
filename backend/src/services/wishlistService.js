import wishlistModel from '~/models/wishlists'
import { Types } from 'mongoose'

// Get user's wishlist
const getUserWishlist = async (userId) => {
  try {
    let wishlist = await wishlistModel
      .findOne({ user: userId })
      .populate({
        path: 'properties',
        match: { _destroy: { $ne: true } },
        populate: [
          {
            path: 'owner',
            select: '-password -verifyToken -__v'
          }
        ]
      })

    if (!wishlist) {
      // Create new wishlist if doesn't exist
      wishlist = await wishlistModel.create({
        user: userId,
        properties: []
      })
    }

    // Filter out null properties (deleted ones)
    wishlist.properties = wishlist.properties.filter(p => p !== null)

    return {
      success: true,
      wishlist: wishlist,
      count: wishlist.properties.length
    }
  } catch (error) {
    throw error
  }
}

// Add property to wishlist
const addToWishlist = async (userId, propertyId) => {
  try {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new Error('Invalid property ID')
    }

    let wishlist = await wishlistModel.findOne({ user: userId })

    if (!wishlist) {
      wishlist = await wishlistModel.create({
        user: userId,
        properties: [propertyId]
      })
    } else {
      // Check if already exists
      const exists = wishlist.properties.some(
        p => p.toString() === propertyId
      )

      if (exists) {
        throw new Error('Property already in wishlist')
      }

      wishlist.properties.push(propertyId)
      await wishlist.save()
    }

    // Populate for response
    await wishlist.populate({
      path: 'properties',
      match: { _destroy: { $ne: true } },
      populate: { path: 'owner', select: '-password -verifyToken -__v' }
    })

    return {
      success: true,
      message: 'Added to wishlist',
      wishlist: wishlist,
      count: wishlist.properties.length
    }
  } catch (error) {
    throw error
  }
}

// Remove property from wishlist
const removeFromWishlist = async (userId, propertyId) => {
  try {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new Error('Invalid property ID')
    }

    const wishlist = await wishlistModel.findOne({ user: userId })

    if (!wishlist) {
      throw new Error('Wishlist not found')
    }

    wishlist.properties = wishlist.properties.filter(
      p => p.toString() !== propertyId
    )
    await wishlist.save()

    await wishlist.populate({
      path: 'properties',
      match: { _destroy: { $ne: true } },
      populate: { path: 'owner', select: '-password -verifyToken -__v' }
    })

    return {
      success: true,
      message: 'Removed from wishlist',
      wishlist: wishlist,
      count: wishlist.properties.length
    }
  } catch (error) {
    throw error
  }
}

// Check if property is in wishlist
const isInWishlist = async (userId, propertyId) => {
  try {
    if (!Types.ObjectId.isValid(propertyId)) {
      return { inWishlist: false }
    }

    const wishlist = await wishlistModel.findOne({ user: userId })

    if (!wishlist) {
      return { inWishlist: false }
    }

    const exists = wishlist.properties.some(
      p => p.toString() === propertyId
    )

    return { inWishlist: exists }
  } catch (error) {
    throw error
  }
}

// Toggle wishlist (add if not exists, remove if exists)
const toggleWishlist = async (userId, propertyId) => {
  try {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new Error('Invalid property ID')
    }

    let wishlist = await wishlistModel.findOne({ user: userId })

    if (!wishlist) {
      wishlist = await wishlistModel.create({
        user: userId,
        properties: [propertyId]
      })
      
      await wishlist.populate({
        path: 'properties',
        match: { _destroy: { $ne: true } },
        populate: { path: 'owner', select: '-password -verifyToken -__v' }
      })

      return {
        success: true,
        action: 'added',
        message: 'Added to wishlist',
        wishlist: wishlist,
        count: wishlist.properties.length
      }
    }

    const exists = wishlist.properties.some(
      p => p.toString() === propertyId
    )

    if (exists) {
      // Remove
      wishlist.properties = wishlist.properties.filter(
        p => p.toString() !== propertyId
      )
      await wishlist.save()

      await wishlist.populate({
        path: 'properties',
        match: { _destroy: { $ne: true } },
        populate: { path: 'owner', select: '-password -verifyToken -__v' }
      })

      return {
        success: true,
        action: 'removed',
        message: 'Removed from wishlist',
        wishlist: wishlist,
        count: wishlist.properties.length
      }
    } else {
      // Add
      wishlist.properties.push(propertyId)
      await wishlist.save()

      await wishlist.populate({
        path: 'properties',
        match: { _destroy: { $ne: true } },
        populate: { path: 'owner', select: '-password -verifyToken -__v' }
      })

      return {
        success: true,
        action: 'added',
        message: 'Added to wishlist',
        wishlist: wishlist,
        count: wishlist.properties.length
      }
    }
  } catch (error) {
    throw error
  }
}

export const wishlistService = {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  toggleWishlist
}
