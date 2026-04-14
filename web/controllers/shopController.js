export const getShop = async(req, res) => {
    try {
        const { shopRecord } = res.locals;
        const shopData = shopRecord.toObject ? shopRecord.toObject() : shopRecord;
        const filteredData = { ...shopData };
        delete filteredData.accessToken
        return res.status(200).json({
            success: true,
            data: filteredData,
        });
    } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}