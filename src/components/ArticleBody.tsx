import ReactMarkdown from 'react-markdown';

export default function ArticleBody({ body }: { body: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-green-300 mt-8 mb-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold text-green-400 mt-6 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold text-green-500 mt-4 mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-neutral-300 leading-relaxed mb-4">{children}</p>,
          strong: ({ children }) => <strong className="text-neutral-100 font-semibold">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4 text-neutral-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-4 text-neutral-300">{children}</ol>,
          li: ({ children }) => <li className="ml-2">{children}</li>,
          a: ({ href, children }) => <a href={href} className="text-green-400 hover:text-green-300 underline">{children}</a>,
          code: ({ children }) => <code className="bg-neutral-800 text-green-300 px-1 rounded text-sm">{children}</code>,
          pre: ({ children }) => <pre className="bg-neutral-900 border border-neutral-700 rounded p-4 overflow-x-auto mb-4 text-sm">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-green-700 pl-4 italic text-neutral-400 mb-4">{children}</blockquote>,
          hr: () => <hr className="border-neutral-700 my-6" />,
          img: ({ src, alt }) => (
            <img src={src ?? ''} alt={alt ?? ''} className="max-w-full rounded my-4" loading="lazy" />
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
