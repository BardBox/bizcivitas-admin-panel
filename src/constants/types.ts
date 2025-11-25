// src/types.ts
export interface Media {
  _id: string;
  title: string;
  description?: string;
  folder?: string;
  type?: string;
  url?: string;
}

export interface Collection {
  _id: string;
  type: 'expert' | 'knowledge' | 'membership' | 'resource' | 'express';
  expertType?: 'Business Excellence' | 'Employee Development';
  title: string;
  description: string;
  thumbnailUrl: string;
  createdBy: { _id: string; fname: string; lname: string; email: string };
  submittedBy?: { _id: string; fname: string; lname: string; email: string };
  author: string;
  subItems?: Media[];
  tags?: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
  savedBy?: { userId: string; savedDate: string }[];
}
