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

export const listingTierController = {
    getTiers
}