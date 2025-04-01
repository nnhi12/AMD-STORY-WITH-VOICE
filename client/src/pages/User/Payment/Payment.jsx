import React, { useEffect, useState } from "react";
import { PayPalButton } from "react-paypal-button-v2";
import axios from "axios";
import Swal from "sweetalert2";
import "./Payment.css";
import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import { API_URL } from "../../../env.js";
import useVoiceControl from '../../../utils/voiceControl.js';

const PaymentPage = () => {
    const [sdkReady, setSdkReady] = useState(false);
    const [userId, setUserId] = useState(null);
    const [accountStatus, setAccountStatus] = useState(null); // Trạng thái tài khoản
    const [oldStatus, setOldStatus] = useState(null); // Trạng thái cũ

    useEffect(() => {
        const storedUserId = localStorage.getItem("accountId");
        console.log("Lấy userId từ localStorage:", storedUserId);
        setUserId(storedUserId);
    }, []);

    useEffect(() => {
        console.log("userId đã được set:", userId);
        if (userId) { // Chỉ gọi API nếu userId không phải null
            axios.get(`${API_URL}/account-status?accountId=${userId}`)
                .then(response => {
                    setOldStatus(response.data.status); // Gán trạng thái cũ
                })
                .catch(error => {
                    console.error("Lỗi khi lấy trạng thái tài khoản:", error);
                });
        } else {
            console.warn("userId là null. Không thể lấy trạng thái tài khoản.");
        }
    }, [userId]);
    

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
            const response = await axios.post(`${API_URL}/update-status`, { accountId: userId });
            console.log(response.data);

            Swal.fire({
                icon: 'success',
                title: 'Thanh toán thành công!',
                text: `VIP đã kích hoạt từ ${response.data.startDate} đến ${response.data.endDate}`,
                confirmButtonText: 'OK',
            });

            // Cập nhật trạng thái tài khoản sau khi thanh toán
            setAccountStatus(true);
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

    useVoiceControl("", "", "");

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
                        <p className="price"><span>99,000 VND</span></p>
                    </div>
                </div>
                <div className="payment-right">
                    {oldStatus === true || accountStatus===true ? (
                        // Nếu tài khoản là VIP, ẩn nút PayPal
                        <p>Bạn đã là thành viên VIP!</p>
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
