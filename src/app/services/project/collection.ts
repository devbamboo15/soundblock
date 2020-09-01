import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { BreadcrumbItem } from 'src/app/models/breadcrumbItem';
import { Collection, File } from 'src/app/models/collection';
import { SubSink } from 'subsink';
@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private subs = new SubSink();
  currentTab: BehaviorSubject<string>;

  curItemListObs: Observable<any>;
  curItemList: BehaviorSubject<any>;
  checkedList: BehaviorSubject<{music: any, video: any, merch: any, other: any}>;

  breadcrumb: BreadcrumbItem[] = [];
  currentPath = '';
  historyMenuShowStatus: true;
  constructor(
    private http: HttpClient,
  ) {
    this.initData();
  }

  initData() {
    this.currentTab = new BehaviorSubject('');
    this.curItemList = new BehaviorSubject('');
    this.checkedList = new BehaviorSubject({
      music: [],
      video: [],
      merch: [],
      other: []
    });
  }
  
  getCollectionFiles(collection, filePath, fileCategory) {
    let params = new HttpParams();
    params = params.append('file_path', filePath);
    params = params.append('file_category', fileCategory);
    return this.http.get<any>(`soundblock/project/collection/${collection}`, { params }).pipe(map(res => {
      const data = new Collection().deserialize(res.data);
      return data;
    }));
  }
  
  getCollectionHistory(colUuid) {
    return this.http.get<any>(`soundblock/project/collection/${colUuid}/history`).pipe(map(res => {
      console.log('collection history', res);
      return res.data;
    }));
  }

  addFolder(category, project, comment, name, path) {
    const req = {file_category: category, project, collection_comment: comment, directory_name: name, directory_path: path};
    return this.http.post<any>(`soundblock/project/collection/directory`, req);
  }
  editFolder(category, project, comment, name, newName, path) {
    const req = {file_category: category, project, collection_comment: comment, directory_name: name,
      directory_path: path, new_directory_name: newName};
    return this.http.patch<any>(`soundblock/project/collection/directory`, req);
  }
  deleteFolder(category, project, comment, name, path) {
    const req = {file_category: category, project, collection_comment: comment, directory_name: name, directory_path: path};
    return this.http.post<any>(`soundblock/project/collection/directory`, req);
  }
  restoreFolder(category, collection, comment, uuid) {
    const req = {file_category: category, collection, collection_comment: comment, directory: uuid};
    return this.http.post<any>(`soundblock/project/collection/restore`, req);
  }
  revertFolder(category, collection, comment, uuid) {
    const req = {file_category: category, collection, collection_comment: comment, directory: uuid};
    return this.http.post<any>(`soundblock/project/collection/revert`, req);
  }
  editFiles(category, project, comment, files) {
    const req = {file_category: category, project, collection_comment: comment, files};
    return this.http.patch<any>(`soundblock/project/collection/files`, req);
  }
  restoreFile(category, collection, comment, files) {
    const req = {file_category: category, collection, collection_comment: comment, files};
    return this.http.post<any>(`soundblock/project/collection/restore`, req);
  }
  revertFile(category, collection, comment, files) {
    const req = {file_category: category, collection, collection_comment: comment, files};
    return this.http.post<any>(`soundblock/project/collection/revert`, req);
  }
  deleteFiles(category, project, comment, files) {
    let params = new HttpParams();
    params = params.append('project', project);
    params = params.append('collection_comment', comment);
    params = params.append('file_category', category);
    for (let i = 0; i < files.length; i ++) {
      params = params.append(`files[${i}][file_uuid]`, files[i].file_uuid);
    }

    return this.http.delete<any>(`soundblock/project/collection/files`, { params });
  }

  organizeMusic(category, project, comment, files) {
    const req = {file_category: category, project, collection_comment: comment, files};
    return this.http.post<any>(`soundblock/project/collection/organize-musics`, req).pipe(map(res => {
      return res.data;
    }));
  }

  getFileHistory(fileUuid) {
    return this.http.get<any>(`soundblock/project/collection/file/${fileUuid}/history`).pipe(map(res => {
      return res.data;
    }));
  }

  downloadFiles(collection, files) {
    let params = new HttpParams();
    for (let i = 0; i < files.length; i ++) {
      params = params.append(`files[${i}][file_uuid]`, files[i].file_uuid);
    }

    return this.http.get<any>(`soundblock/project/collection/${collection}/download`, { params }).pipe(map(res => {
      return res.data;
    }));
  }

  setCurrentTab(val) {
    this.currentTab.next(val);
  }
  watchCurrentTab() {
    return this.currentTab.asObservable();
  }
  watchCheckedList() {
    return this.checkedList.asObservable();
  }
  watchCurItemList() {
    return this.curItemList.asObservable();
  }
  addToCheckedList(file) {
    const category = file.file_category;
    let list = this.checkedList.value;
    list[category] = list[category].filter(item => item.file_uuid != file.file_uuid);
    list[category].push(file);
    this.checkedList.next(list);
  }

  deleteFromCheckedList(file) {
    const category = file.file_category;
    let list = this.checkedList.value;
    list[category] = list[category].filter(item => item.file_uuid != file.file_uuid);
    this.checkedList.next(list);
  }

  clearCheckedList() {
    this.checkedList.next({
      music: [],
      video: [],
      merch: [],
      other: []
    });
  }

  isFileChecked(file) {
    const category = file.file_category;
    const list = this.checkedList.value;
    const index = list[category].findIndex(item => item.file_uuid == file.file_uuid);
    return index != -1;
  }

  updateDataWithBreadcrumb(breadcrumb: BreadcrumbItem[], collectionUuid) {
    let path = '';
    breadcrumb.forEach(node => {
      path += '/' + node.name;
    });
    path = path.substring(1);
    this.currentPath = path;
    this.curItemListObs = this.getCollectionFiles(collectionUuid, path, this.currentTab.value);
    this.subs.sink = this.curItemListObs.subscribe(res => {
      this.curItemList.next(res);
    });
  }
}
