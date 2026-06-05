// services/kotak.service.js
class KotakService {
    getHeaders(session) {
        return {
            'Authorization': process.env.KOTAK_ACCESS_TOKEN,
            'neo-fin-key': 'neotradeapi',
            'Content-Type': 'application/json',
            'sid': session.tradeSid,
            'Auth': session.tradeToken
        };
    }

    // Validate if session is active
    isSessionActive(session) {
        return session && 
               session.isAuthenticated && 
               session.tradeToken && 
               session.tradeSid && 
               session.baseUrl;
    }

    // Format order data
    formatOrderData(orderData) {
        return {
            exchange: orderData.exchange,
            tradingSymbol: orderData.tradingSymbol,
            quantity: parseInt(orderData.quantity),
            price: parseFloat(orderData.price) || 0,
            transactionType: orderData.transactionType,
            productType: orderData.productType || 'DELIVERY',
            orderType: orderData.orderType || 'LIMIT',
            validity: orderData.validity || 'DAY',
            disclosedQuantity: parseInt(orderData.disclosedQuantity) || 0,
            triggerPrice: parseFloat(orderData.triggerPrice) || 0
        };
    }

    // Handle API errors
    handleError(error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            return {
                status: error.response.status,
                message: error.response.data?.message || 'API Error',
                data: error.response.data
            };
        } else if (error.request) {
            // The request was made but no response was received
            return {
                status: 503,
                message: 'No response from server',
                data: null
            };
        } else {
            // Something happened in setting up the request
            return {
                status: 500,
                message: error.message,
                data: null
            };
        }
    }
}

module.exports = KotakService;