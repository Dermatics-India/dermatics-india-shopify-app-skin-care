import { plansData } from "../constant/plans.js";

export const getShop = async(req, res) => {
    try {
        const { shopRecord } = res.locals;
        const shopData = shopRecord.toObject ? shopRecord.toObject() : shopRecord;
        const filteredData = { ...shopData };
        delete filteredData.accessToken;

        // Attach plan name to subscription
        const planId = filteredData.subscription?.planId;
        const plan = plansData.find((p) => p._id === planId);
        if (filteredData.subscription) {
            filteredData.subscription.planName = plan?.name || "Free";
        }

        return res.status(200).json({
            success: true,
            data: filteredData,
        });
    } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}