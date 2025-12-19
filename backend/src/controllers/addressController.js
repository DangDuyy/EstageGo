import mongoose from "mongoose";
import { addressService } from "~/services/addressService";

class AddressController {
  // Province Controllers
  async getAllProvinces(req, res) {
    try {
      const provinces = await addressService.getAllProvinces();
      res.json({
        success: true,
        data: provinces
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProvinceByCode(req, res) {
    try {
      const { code } = req.params;
      const province = await addressService.getProvinceByCode(parseInt(code));
      
      if (!province) {
        return res.status(404).json({
          success: false,
          message: 'Province not found'
        });
      }
      
      res.json({
        success: true,
        data: province
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProvinceWithFullData(req, res) {
    try {
      const { code } = req.params;
      const province = await addressService.getProvinceWithFullData(parseInt(code));
      
      if (!province) {
        return res.status(404).json({
          success: false,
          message: 'Province not found'
        });
      }
      
      res.json({
        success: true,
        data: province
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // District Controllers
  async getAllDistricts(req, res) {
    try {
      const districts = await addressService.getAllDistricts();
      res.json({
        success: true,
        data: districts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getDistrictsByProvinceCode(req, res) {
    try {
      const { provinceCode } = req.params;
      const districts = await addressService.getDistrictsByProvinceCode(parseInt(provinceCode));
      
      res.json({
        success: true,
        data: districts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getDistrictByCode(req, res) {
    try {
      const { code } = req.params;
      const district = await addressService.getDistrictByCode(parseInt(code));
      
      if (!district) {
        return res.status(404).json({
          success: false,
          message: 'District not found'
        });
      }
      
      res.json({
        success: true,
        data: district
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Ward Controllers
  async getAllWards(req, res) {
    try {
      const wards = await addressService.getAllWards();
      res.json({
        success: true,
        data: wards
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWardsByDistrictCode(req, res) {
    try {
      const { districtCode } = req.params;
      const wards = await addressService.getWardsByDistrictCode(parseInt(districtCode));
      
      res.json({
        success: true,
        data: wards
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWardByCode(req, res) {
    try {
      const { code } = req.params;
      const ward = await addressService.getWardByCode(parseInt(code));
      
      if (!ward) {
        return res.status(404).json({
          success: false,
          message: 'Ward not found'
        });
      }
      
      res.json({
        success: true,
        data: ward
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Import data
  async importData(req, res) {
    try {
      const provinceData = req.body;
      const result = await addressService.importData(provinceData);
      
      res.status(201).json({
        success: true,
        message: 'Data imported successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Search
  async searchAddress(req, res) {
    try {
      const { keyword } = req.query;
      
      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: 'Keyword is required'
        });
      }
      
      const results = await addressService.searchAddress(keyword);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const addressController = new AddressController()