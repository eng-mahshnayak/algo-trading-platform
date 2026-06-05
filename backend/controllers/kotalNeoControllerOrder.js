// controllers/order.controller.js


import axios from "axios";
import KotakService from "../services/kotak.service.js";

class OrderController {
    constructor() {
        this.kotakService = new KotakService();
    }

    // Place Order
    async placeOrder(req, res) {
        try {
            // Check authentication
            if (!req.session.isAuthenticated) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login first'
                });
            }

            const {
                exchange,
                tradingSymbol,
                quantity,
                price,
                transactionType,
                productType,
                orderType,
                validity,
                disclosedQuantity,
                triggerPrice
            } = req.body;

            // Validation
            if (!exchange || !tradingSymbol || !quantity || !transactionType) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            const orderData = {
                exchange,
                tradingSymbol,
                quantity: parseInt(quantity),
                price: parseFloat(price) || 0,
                transactionType, // BUY or SELL
                productType, // DELIVERY, INTRADAY, MARGIN
                orderType, // MARKET, LIMIT, SL, SLM
                validity: validity || 'DAY',
                disclosedQuantity: disclosedQuantity || 0,
                triggerPrice: triggerPrice || 0
            };

            // Make API call to Kotak
            const response = await axios.post(
                `${req.session.baseUrl}/orders/1.0/placeOrder`,
                orderData,
                {
                    headers: this.kotakService.getHeaders(req.session)
                }
            );

            // Log order for tracking
            console.log('Order Placed:', {
                orderId: response.data?.data?.orderId,
                timestamp: new Date().toISOString(),
                user: req.session.userId
            });

            res.status(200).json({
                success: true,
                message: 'Order placed successfully',
                data: response.data?.data || response.data
            });

        } catch (error) {
            console.error('Place Order Error:', error.response?.data || error.message);
            
            // Handle specific error cases
            if (error.response?.status === 401) {
                req.session.isAuthenticated = false;
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please login again.',
                    requiresLogin: true
                });
            }

            res.status(error.response?.status || 500).json({
                success: false,
                message: error.response?.data?.message || 'Order placement failed',
                error: error.response?.data || error.message
            });
        }
    }

    // Modify Order
    async modifyOrder(req, res) {
        try {
            if (!req.session.isAuthenticated) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login first'
                });
            }

            const { orderId, quantity, price, triggerPrice } = req.body;

            const modifyData = {
                orderId,
                quantity: parseInt(quantity),
                price: parseFloat(price),
                triggerPrice: parseFloat(triggerPrice) || 0
            };

            const response = await axios.post(
                `${req.session.baseUrl}/orders/1.0/modifyOrder`,
                modifyData,
                {
                    headers: this.kotakService.getHeaders(req.session)
                }
            );

            res.status(200).json({
                success: true,
                message: 'Order modified successfully',
                data: response.data?.data || response.data
            });

        } catch (error) {
            console.error('Modify Order Error:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                success: false,
                message: error.response?.data?.message || 'Order modification failed',
                error: error.response?.data || error.message
            });
        }
    }

    // Cancel Order
    async cancelOrder(req, res) {
        try {
            if (!req.session.isAuthenticated) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login first'
                });
            }

            const { orderId } = req.params;

            const response = await axios.post(
                `${req.session.baseUrl}/orders/1.0/cancelOrder`,
                { orderId },
                {
                    headers: this.kotakService.getHeaders(req.session)
                }
            );

            res.status(200).json({
                success: true,
                message: 'Order cancelled successfully',
                data: response.data?.data || response.data
            });

        } catch (error) {
            console.error('Cancel Order Error:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                success: false,
                message: error.response?.data?.message || 'Order cancellation failed',
                error: error.response?.data || error.message
            });
        }
    }

    // Get Order Book
    async getOrderBook(req, res) {
        try {
            if (!req.session.isAuthenticated) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login first'
                });
            }

            const response = await axios.get(
                `${req.session.baseUrl}/orders/1.0/orderBook`,
                {
                    headers: this.kotakService.getHeaders(req.session)
                }
            );

            res.status(200).json({
                success: true,
                data: response.data?.data || response.data
            });

        } catch (error) {
            console.error('Get Order Book Error:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                success: false,
                message: error.response?.data?.message || 'Failed to fetch order book',
                error: error.response?.data || error.message
            });
        }
    }

    // Get Order Details
    async getOrderDetails(req, res) {
        try {
            if (!req.session.isAuthenticated) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login first'
                });
            }

            const { orderId } = req.params;

            const response = await axios.get(
                `${req.session.baseUrl}/orders/1.0/orderDetails/${orderId}`,
                {
                    headers: this.kotakService.getHeaders(req.session)
                }
            );

            res.status(200).json({
                success: true,
                data: response.data?.data || response.data
            });

        } catch (error) {
            console.error('Get Order Details Error:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                success: false,
                message: error.response?.data?.message || 'Failed to fetch order details',
                error: error.response?.data || error.message
            });
        }
    }

    // Get Trade Book
    async getTradeBook(req, res) {
        try {
            if (!req.session.isAuthenticated) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login first'
                });
            }

            const response = await axios.get(
                `${req.session.baseUrl}/orders/1.0/tradeBook`,
                {
                    headers: this.kotakService.getHeaders(req.session)
                }
            );

            res.status(200).json({
                success: true,
                data: response.data?.data || response.data
            });

        } catch (error) {
            console.error('Get Trade Book Error:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                success: false,
                message: error.response?.data?.message || 'Failed to fetch trade book',
                error: error.response?.data || error.message
            });
        }
    }

    // Get Position Book
    async getPositionBook(req, res) {
        try {
            if (!req.session.isAuthenticated) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login first'
                });
            }

            const response = await axios.get(
                `${req.session.baseUrl}/orders/1.0/positionBook`,
                {
                    headers: this.kotakService.getHeaders(req.session)
                }
            );

            res.status(200).json({
                success: true,
                data: response.data?.data || response.data
            });

        } catch (error) {
            console.error('Get Position Book Error:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                success: false,
                message: error.response?.data?.message || 'Failed to fetch positions',
                error: error.response?.data || error.message
            });
        }
    }

    // Get Holdings
    async getHoldings(req, res) {
        try {
            if (!req.session.isAuthenticated) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login first'
                });
            }

            const response = await axios.get(
                `${req.session.baseUrl}/portfolio/1.0/holdings`,
                {
                    headers: this.kotakService.getHeaders(req.session)
                }
            );

            res.status(200).json({
                success: true,
                data: response.data?.data || response.data
            });

        } catch (error) {
            console.error('Get Holdings Error:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                success: false,
                message: error.response?.data?.message || 'Failed to fetch holdings',
                error: error.response?.data || error.message
            });
        }
    }

    // Get Funds Summary
    async getFundsSummary(req, res) {
        try {
            if (!req.session.isAuthenticated) {
                return res.status(401).json({
                    success: false,
                    message: 'Please login first'
                });
            }

            const response = await axios.get(
                `${req.session.baseUrl}/portfolio/1.0/funds`,
                {
                    headers: this.kotakService.getHeaders(req.session)
                }
            );

            res.status(200).json({
                success: true,
                data: response.data?.data || response.data
            });

        } catch (error) {
            console.error('Get Funds Error:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                success: false,
                message: error.response?.data?.message || 'Failed to fetch funds',
                error: error.response?.data || error.message
            });
        }
    }
}

module.exports = new OrderController();