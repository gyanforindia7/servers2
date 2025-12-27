
import React from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '../types';
import { Calendar, Tag } from './Icons';

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const formattedDate = post.date ? new Date(post.date).toLocaleDateString() : 'Recent';

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-slate-200 overflow-hidden flex flex-col h-full group">
      <Link to={`/blog/${post.slug}`} className="block relative aspect-video overflow-hidden bg-slate-100">
        <img 
          src={post.coverImage || 'https://picsum.photos/seed/tech/800/450'} 
          alt={post.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
      </Link>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1"><Calendar size={12} /> {formattedDate}</span>
          {post.tags && post.tags.length > 0 && (
             <span className="flex items-center gap-1"><Tag size={12} /> {post.tags[0]}</span>
          )}
        </div>
        <Link to={`/blog/${post.slug}`}>
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
        <p className="text-slate-600 text-sm mb-4 line-clamp-3">
          {post.excerpt}
        </p>
        <Link 
          to={`/blog/${post.slug}`} 
          className="mt-auto inline-flex items-center text-blue-600 font-semibold text-sm hover:underline"
        >
          Read Article
        </Link>
      </div>
    </div>
  );
};
