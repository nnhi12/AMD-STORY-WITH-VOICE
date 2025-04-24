import React, { useEffect, useState } from 'react';
import { PayPalButton } from 'react-paypal-button-v2';
import axios from 'axios';
import Swal from 'sweetalert2';
import './Payment.css';
import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import { API_URL } from '../../../env.js';
import useVoiceControl from '../../../utils/voiceControl.js';

const PaymentPage = () => {
    const [sdkReady, setSdkReady] = useState(false);
    const [accountId, setAccountId] = useState(null);
    const [isVip, setIsVip] = useState(false); // Trạng thái VIP
    const [subscriptionInfo, setSubscriptionInfo] = useState(null); // Thông tin subscription

    useEffect(() => {
        const storedAccountId = localStorage.getItem('accountId');
        console.log('Lấy accountId từ localStorage:', storedAccountId);
        setAccountId(storedAccountId);
    }, []);

    useEffect(() => {
        console.log('accountId đã được set:', accountId);
        if (accountId) {
            // Kiểm tra trạng thái VIP
            axios
                .post(`${API_URL}/update-status`, { accountId, checkOnly: true })
                .then((response) => {
                    setIsVip(response.data.isVip);
                    setSubscriptionInfo({
                        start_date: response.data.startDate,
                        expired_date: response.data.endDate,
                    });
                })
                .catch((error) => {
                    console.error('Lỗi khi kiểm tra trạng thái VIP:', error);
                });
        } else {
            console.warn('accountId là null. Không thể kiểm tra trạng thái VIP.');
        }
    }, [accountId]);

    const addPaypalScripts = async () => {
        if (!window.paypal) {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = `https://sandbox.paypal.com/sdk/js?client-id=AbrsNExjom4br2bY-SMSqb_sE_2cd1LG2j76avElOO8k4aJhNZCqRAqHziCAdFsrcqKPrWQZbwRbbRmB`;
            script.async = true;
            script.onload = () => setSdkReady(true);
            document.body.appendChild(script);
        } else {
            setSdkReady(true);
        }
    };

    const onSuccessPaypal = async (details, data) => {
        console.log('Thanh toán thành công:', details, data);
        try {
            const response = await axios.post(`${API_URL}/update-status`, { accountId });
            console.log(response.data);

            Swal.fire({
                icon: 'success',
                title: 'Thanh toán thành công!',
                text: `VIP đã kích hoạt từ ${new Date(response.data.startDate).toLocaleDateString()} đến ${new Date(response.data.endDate).toLocaleDateString()}`,
                confirmButtonText: 'OK',
            });

            // Cập nhật trạng thái VIP
            setIsVip(true);
            setSubscriptionInfo({
                start_date: response.data.startDate,
                expired_date: response.data.endDate,
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Có lỗi xảy ra khi cập nhật trạng thái tài khoản.',
                confirmButtonText: 'OK',
            });
        }
    };

    useEffect(() => {
        addPaypalScripts();
    }, []);

    useVoiceControl('', '', '');

    return (
        <div className="payment-page">
            <Header />
            <Navbar />
            <div className="payment-container">
                <div className="payment-left">
                    <h2 className="payment-title">Trở thành Thành viên VIP</h2>
                    <p className="payment-description">
                        Chỉ với 99,000 VND bạn sẽ nhận được 1 tháng đọc truyện không giới hạn trên trang web.
                    </p>
                    <div className="price-box">
                        <p className="price">
                            <span>99,000 VND</span>
                        </p>
                    </div>
                </div>
                <div className="payment-right">
                    {isVip && subscriptionInfo && new Date(subscriptionInfo.expired_date) > new Date() ? (
                        <p>
                            Bạn đã là thành viên VIP! Hiệu lực đến{' '}
                            {new Date(subscriptionInfo.expired_date).toLocaleDateString()}
                        </p>
                    ) : (
                        sdkReady ? (
                            <PayPalButton
                                amount="3.9"
                                onSuccess={onSuccessPaypal}
                                onError={() => {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Oops...',
                                        text: 'Đã xảy ra lỗi khi thanh toán.',
                                        confirmButtonText: 'OK',
                                    });
                                }}
                            />
                        ) : (
                            <div>Loading PayPal...</div>
                        )
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PaymentPage;