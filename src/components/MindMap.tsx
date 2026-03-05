import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Task, Subtask, Agent } from '../types';
import { FunkoAvatar } from './FunkoAvatar';
import { Plus, MessageCircle } from 'lucide-react';

interface MindMapProps {
  task: Task;
  agents: Agent[];
  onNodeClick?: (subtask: Subtask) => void;
  onAddSubtask?: (agentId: string) => void;
  onAnswerQuestion?: (agentId: string, question: string) => void;
}

export const MindMap: React.FC<MindMapProps> = ({ task, agents, onNodeClick, onAddSubtask, onAnswerQuestion }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeQuestion, setActiveQuestion] = useState<{ agentId: string, text: string } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !task) return;

    const width = 800;
    const height = 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const data = {
      name: task.title,
      id: 'root',
      children: task.subtasks?.map(s => ({ ...s, name: s.title })) || []
    };

    const root = d3.hierarchy(data);
    const treeLayout = d3.tree().size([height - 100, width - 200]);
    treeLayout(root);

    const g = svg.append("g")
      .attr("transform", "translate(100, 50)");

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal()
        .x((d: any) => d.y)
        .y((d: any) => d.x) as any)
      .attr("fill", "none")
      .attr("stroke", "#334155")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .style("opacity", 0.5);

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    // Add Avatars to Nodes
    node.each(function(d: any) {
      const gNode = d3.select(this);
      
      if (d.depth === 0) {
        // Root Node - Architect
        gNode.append("foreignObject")
          .attr("x", -30)
          .attr("y", -30)
          .attr("width", 60)
          .attr("height", 60)
          .append("xhtml:div")
          .style("width", "60px")
          .style("height", "60px")
          .html(`<div class="glass-panel rounded-xl p-1 border-[#00ff41]/30"><img src="data:image/svg+xml;base64,${btoa(renderFunkoSVG('architect'))}" style="width:100%;height:100%"/></div>`);
      } else {
        // Subtask Nodes - Agents
        const agent = agents.find(a => a.id === d.data.agentId);
        const type = agent ? getFunkoType(agent.name) : 'neo';
        
        const container = gNode.append("foreignObject")
          .attr("x", -25)
          .attr("y", -25)
          .attr("width", 50)
          .attr("height", 50)
          .style("cursor", "pointer")
          .on("click", () => {
            if (onAddSubtask && agent) onAddSubtask(agent.id);
          });

        container.append("xhtml:div")
          .style("width", "50px")
          .style("height", "50px")
          .attr("class", "group relative")
          .html(`
            <div class="glass-panel rounded-lg p-1 border-white/10 group-hover:border-[#00ff41]/50 transition-all">
              <img src="data:image/svg+xml;base64,${btoa(renderFunkoSVG(type))}" style="width:100%;height:100%"/>
              <div class="absolute -top-2 -right-2 bg-[#00ff41] text-black rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
            </div>
          `);

        // Randomly show "Question Balloons"
        if (Math.random() > 0.7 && !activeQuestion) {
          const balloon = gNode.append("foreignObject")
            .attr("x", 10)
            .attr("y", -60)
            .attr("width", 120)
            .attr("height", 60)
            .attr("class", "animate-bounce");

          balloon.append("xhtml:div")
            .attr("class", "bg-[#00ff41] text-black text-[8px] font-bold p-2 rounded-xl rounded-bl-none shadow-lg relative")
            .html(`
              <div class="truncate">Need more data on Zion?</div>
              <div class="mt-1 flex justify-end">
                <button class="bg-black text-[#00ff41] px-1 rounded">Reply</button>
              </div>
            `)
            .on("click", () => {
              if (onAnswerQuestion && agent) onAnswerQuestion(agent.id, "Need more data on Zion?");
            });
        }
      }
    });

    node.append("text")
      .attr("dy", "40")
      .attr("text-anchor", "middle")
      .text((d: any) => d.data.name)
      .style("font-size", "8px")
      .style("font-weight", "bold")
      .attr("fill", "#94a3b8")
      .attr("class", "pointer-events-none");

  }, [task, agents, onNodeClick, onAddSubtask, onAnswerQuestion]);

  return (
    <div className="w-full overflow-x-auto bg-[#050505] rounded-3xl border border-white/5 p-8 shadow-2xl relative">
      <svg ref={svgRef} width="800" height="500" className="mx-auto" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-8 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#00ff41] rounded-full" />
          <span className="text-[8px] font-bold text-slate-500 uppercase">Active Node</span>
        </div>
        <div className="flex items-center gap-2">
          <Plus className="w-3 h-3 text-[#00ff41]" />
          <span className="text-[8px] font-bold text-slate-500 uppercase">Click Avatar to Add Task</span>
        </div>
      </div>
    </div>
  );
};

// Helper to render Funko SVG for D3 inclusion
function renderFunkoSVG(type: string) {
  const colors: any = {
    neo: { hair: '#0a0a0a', skin: '#fce4ec', suit: '#000000', eyes: '#000000' },
    trinity: { hair: '#000000', skin: '#fce4ec', suit: '#1a1a1a', eyes: '#000000' },
    morpheus: { hair: '#000000', skin: '#5d4037', suit: '#4a0e0e', eyes: '#000000' },
    smith: { hair: '#4a4a4a', skin: '#fce4ec', suit: '#2c3e50', eyes: '#000000' },
    architect: { hair: '#e0e0e0', skin: '#fce4ec', suit: '#ffffff', eyes: '#000000' },
  };
  const c = colors[type] || colors.neo;
  return `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="32" y="65" width="36" height="25" rx="4" fill="${c.suit}" />
      <rect x="18" y="12" width="64" height="55" rx="12" fill="${c.skin}" />
      <circle cx="38" cy="48" r="7" fill="${c.eyes}" />
      <circle cx="62" cy="48" r="7" fill="${c.eyes}" />
      ${type !== 'architect' ? `
        <rect x="28" y="42" width="18" height="12" rx="5" fill="#000" />
        <rect x="54" y="42" width="18" height="12" rx="5" fill="#000" />
      ` : ''}
    </svg>
  `;
}

function getFunkoType(name: string): any {
  const n = name.toLowerCase();
  if (n.includes('neo')) return 'neo';
  if (n.includes('trinity')) return 'trinity';
  if (n.includes('morpheus')) return 'morpheus';
  if (n.includes('smith')) return 'smith';
  if (n.includes('architect')) return 'architect';
  return 'neo';
}
