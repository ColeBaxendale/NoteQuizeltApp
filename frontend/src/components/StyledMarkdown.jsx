import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

const StyledMarkdown = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-full dark:prose-neutral prose-headings:font-semibold prose-p:text-base prose-p:leading-relaxed prose-ul:pl-5 prose-li:marker:text-purple-400">
      <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default StyledMarkdown;
