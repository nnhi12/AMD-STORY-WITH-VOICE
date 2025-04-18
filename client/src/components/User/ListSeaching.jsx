import React from 'react';
import Book from './Book';

const ListSearching = ({ results, showChapters, userId }) => {
    return (
        <div className="container my-5">
            <div className="row row-cols-4">
                {results.length > 0 ? (
                    results.map((book, index) => (
                        <Book 
                            key={index} 
                            data={book} 
                            userId={userId} 
                            showChapters={showChapters} 
                            disabled={book.disabled}
                        />
                    ))
                ) : (
                    <div className="alert alert-info">
                        Không tìm thấy truyện nào phù hợp với từ khóa và độ tuổi của bạn.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListSearching;