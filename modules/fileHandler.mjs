import { promises as fs } from 'fs';
import  path  from 'path';

/**
 * Writes the provided list to a file, formatted as JSON.
 * @param {object} sl - The  list to write.
 * @param {string} vcnName - The name of the VCN.
 */
async function writeListToFile(sl, vcnName, subpath) {
    let fileName = `${vcnName}_${sl.displayName}`.replace(/[/.]/g, '_');
    fileName = `./output/${subpath}/${fileName}.json`;
    try {
        await fs.mkdir(`./output/${subpath}`, { recursive: true });
        await fs.writeFile(fileName, JSON.stringify(sl, null, 2)); // 2 spaces for formatting
    } catch (error) {
        console.error(`Error writing to file ${fileName}:`, error.message);
    }
}

/**
 * Deletes all files within the provided directory path.
 * @param {string} directoryPath - The path to the directory.
 */
async function deleteFilesInDirectory(directoryPath) {
    try {
        const files = await fs.readdir(directoryPath);
        const deletePromises = files.map(file => fs.unlink(path.join(directoryPath, file)));
        await Promise.all(deletePromises);
    } catch (error) {
        // Check if the error is specifically 'ENOENT' (No such file or directory)
        if (error.code !== 'ENOENT') {
            console.error(`Error deleting files in ${directoryPath}:`, error);
        }
    }
}

export { writeListToFile, deleteFilesInDirectory };
