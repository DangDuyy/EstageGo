import { District } from "~/models/district";
import { Province } from "~/models/province";
import { Ward } from "~/models/ward";

class AddressService {
  // Province Services
  async getAllProvinces() {
    return await Province.find()
      .select('-__v')
      .sort({ code: 1 });
  }

  async getProvinceByCode(code) {
    return await Province.findOne({ code })
      .populate({
        path: 'districts',
        select: '-__v',
        options: { sort: { code: 1 } }
      })
      .select('-__v');
  }

  async getProvinceWithFullData(code) {
    return await Province.findOne({ code })
      .populate({
        path: 'districts',
        select: '-__v',
        options: { sort: { code: 1 } },
        populate: {
          path: 'wards',
          select: '-__v',
          options: { sort: { code: 1 } }
        }
      })
      .select('-__v');
  }

  async createProvince(data) {
    const province = new Province(data);
    return await province.save();
  }

  // District Services
  async getAllDistricts() {
    return await District.find()
      .select('-__v')
      .sort({ code: 1 });
  }

  async getDistrictsByProvinceCode(provinceCode) {
    return await District.find({ province_code: provinceCode })
      .select('-__v')
      .sort({ code: 1 });
  }

  async getDistrictByCode(code) {
    return await District.findOne({ code })
      .populate({
        path: 'wards',
        select: '-__v',
        options: { sort: { code: 1 } }
      })
      .select('-__v');
  }

  async createDistrict(data, provinceCode) {
    const district = new District(data);
    const savedDistrict = await district.save();
    
    // Add district to province
    await Province.findOneAndUpdate(
      { code: provinceCode },
      { $push: { districts: savedDistrict._id } }
    );
    
    return savedDistrict;
  }

  // Ward Services
  async getAllWards() {
    return await Ward.find()
      .select('-__v')
      .sort({ code: 1 });
  }

  async getWardsByDistrictCode(districtCode) {
    return await Ward.find({ district_code: districtCode })
      .select('-__v')
      .sort({ code: 1 });
  }

  async getWardByCode(code) {
    return await Ward.findOne({ code })
      .select('-__v');
  }

  async createWard(data, districtCode) {
    const ward = new Ward(data);
    const savedWard = await ward.save();
    
    // Add ward to district
    await District.findOneAndUpdate(
      { code: districtCode },
      { $push: { wards: savedWard._id } }
    );
    
    return savedWard;
  }

  // Bulk import - Single Province
  async importProvince(provinceData) {
    const province = await this.createProvince({
      name: provinceData.name,
      code: provinceData.code,
      division_type: provinceData.division_type,
      codename: provinceData.codename,
      phone_code: provinceData.phone_code
    });

    for (const districtData of provinceData.districts) {
      const district = await this.createDistrict({
        name: districtData.name,
        code: districtData.code,
        division_type: districtData.division_type,
        codename: districtData.codename,
        province_code: districtData.province_code || provinceData.code
      }, province.code);

      for (const wardData of districtData.wards) {
        await this.createWard({
          name: wardData.name,
          code: wardData.code,
          division_type: wardData.division_type,
          codename: wardData.codename,
          district_code: wardData.district_code || districtData.code
        }, district.code);
      }
    }

    return province;
  }

  // Bulk import - Multiple Provinces
  async importMultipleProvinces(provincesArray) {
    const results = {
      success: [],
      failed: [],
      total: provincesArray.length,
      successCount: 0,
      failedCount: 0
    };

    for (const provinceData of provincesArray) {
      try {
        // Check if province already exists
        const existingProvince = await Province.findOne({ code: provinceData.code });
        if (existingProvince) {
          results.failed.push({
            province: provinceData.name,
            code: provinceData.code,
            reason: 'Province already exists'
          });
          results.failedCount++;
          continue;
        }

        const province = await this.importProvince(provinceData);
        
        results.success.push({
          province: province.name,
          code: province.code,
          districtsCount: provinceData.districts.length,
          wardsCount: provinceData.districts.reduce((sum, d) => sum + d.wards.length, 0)
        });
        results.successCount++;

        console.log(`✓ Imported: ${province.name}`);
      } catch (error) {
        results.failed.push({
          province: provinceData.name,
          code: provinceData.code,
          reason: error.message
        });
        results.failedCount++;
        console.error(`✗ Failed: ${provinceData.name} - ${error.message}`);
      }
    }

    return results;
  }

  // Bulk import - All data (backwards compatibility)
  async importData(data) {
    // Check if data is array of provinces or single province
    if (Array.isArray(data)) {
      return await this.importMultipleProvinces(data);
    } else {
      return await this.importProvince(data);
    }
  }

  // Search
  async searchAddress(keyword) {
    const regex = new RegExp(keyword, 'i');
    
    const [provinces, districts, wards] = await Promise.all([
      Province.find({ name: regex }).select('-__v').limit(10),
      District.find({ name: regex }).select('-__v').limit(10),
      Ward.find({ name: regex }).select('-__v').limit(20)
    ]);

    return {
      provinces,
      districts,
      wards
    };
  }
}

export const addressService = new AddressService()