import { listingTierService } from "~/services/ListingTierService"

const { StatusCodes } = require("http-status-codes")

const getTiers = async (req, res, next) => {
    try {
        const tiers = await listingTierService.getAllListingTiers()
        res.status(StatusCodes.OK).json(tiers)
    }
    catch (e) {
        next(e)
    }
}

const createTier = async (req, res, next) => {
    try {
        const tier = await listingTierService.createListingTier(req.body)
        res.status(StatusCodes.CREATED).json({
            success: true,
            data: tier
        })
    }
    catch (e) {
        next(e)
    }
}

const updateTier = async (req, res, next) => {
    try {
        const { tierName } = req.params
        const tier = await listingTierService.updateListingTier(tierName, req.body)
        res.status(StatusCodes.OK).json({
            success: true,
            data: tier
        })
    }
    catch (e) {
        next(e)
    }
}

const updateTierPricing = async (req, res, next) => {
    try {
        const { tierName } = req.params
        const tier = await listingTierService.updateTierPricing(tierName, req.body)
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Pricing updated successfully',
            data: tier
        })
    }
    catch (e) {
        next(e)
    }
}

const deactivateTier = async (req, res, next) => {
    try {
        const { tierName } = req.params
        const tier = await listingTierService.deactivateListingTier(tierName)
        res.status(StatusCodes.OK).json({
            success: true,
            data: tier
        })
    }
    catch (e) {
        next(e)
    }
}

const activateTier = async (req, res, next) => {
    try {
        const { tierName } = req.params
        const tier = await listingTierService.activateListingTier(tierName)
        res.status(StatusCodes.OK).json({
            success: true,
            data: tier
        })
    }
    catch (e) {
        next(e)
    }
}

const getUsageStats = async (req, res, next) => {
    try {
        const stats = await listingTierService.getUsageStats()
        res.status(StatusCodes.OK).json({
            success: true,
            data: stats
        })
    }
    catch (e) {
        next(e)
    }
}

export const listingTierController = {
    getTiers,
    createTier,
    updateTier,
    updateTierPricing,
    deactivateTier,
    activateTier,
    getUsageStats
}