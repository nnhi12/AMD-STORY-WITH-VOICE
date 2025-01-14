import React from 'react';
import Book from './book';

const ListSearching = ({ results, showChapters }) => {
    return (
        <div className="container my-5">
            <div className="row row-cols-4">
                {results.length > 0 ? (
                    results.map((book, index) => (
                        <Book key={index} data={book} showChapters={showChapters} />
                    ))
                ) : (
                    <p>Không có truyện nào tìm thấy.</p>
                )}
            </div>
        </div>
    );
};

export default ListSearching;
