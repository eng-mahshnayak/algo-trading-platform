import License from "../models/licenseModel.js";

export const getAllLicenses = async (req, res) => {
    try {
        const licenses = await License.findAll({
            attributes: ["id", "name"],
        });
        res.status(200).json({
            success: true,
            data: licenses,
        });
    } catch (error) {
        console.error("Error fetching licenses:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching licenses",
        });
    }
};
